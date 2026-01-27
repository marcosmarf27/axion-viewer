# Plano de Implementacao: Area do Cliente Completa com Modelo Hierarquico

## Visao Geral

Implementar sistema completo de area do cliente no Axion Viewer: modelo hierarquico (Cliente > Carteira > Caso > Processo > Documento), autenticacao Supabase, storage em nuvem, painel admin com dashboard/CRUD, painel cliente com navegacao drill-down e filtros avancados. O pipeline de conversao MD→HTML→PDF e o sistema de temas permanecem intocaveis.

## Faseamento em Ciclos

O escopo total e implementado em 3 ciclos sequenciais:

| Ciclo | Fases | Entrega |
|-------|-------|---------|
| **Ciclo 1** | Fase 1-3 | API funcional autenticada com Storage |
| **Ciclo 2** | Fase 4-5 | Painel admin completo com dashboard |
| **Ciclo 3** | Fase 6-7 | Frontend cliente + migracao + deploy |

Cada ciclo produz uma entrega funcional e testavel.

## Garantia de Preservacao

### Arquivos INTOCAVEIS (zero modificacoes)

| Arquivo | Motivo |
|---------|--------|
| `utils/markdown_converter.py` | Pipeline MD→HTML perfeito |
| `utils/pdf_converter.py` | HTML→PDF via WeasyPrint |
| `utils/theme_manager.py` | Temas filesystem (priority: custom > built-in > default) |
| `templates/base.html` | Template Jinja2 com CSS variables |
| `templates/themes/juridico/config.json` | Tema padrao protegido |
| `tests/test_converter.py` | Testes unitarios do converter |

### O que muda vs o que NAO muda

```
PIPELINE DE CONVERSAO (NAO MUDA):
  markdown_text
    → MarkdownConverter.convert()        [INTOCAVEL]
    → MarkdownConverter.extract_title()  [INTOCAVEL]
    → MarkdownConverter.extract_metadata() [INTOCAVEL]
    → ThemeManager.get_theme_config()    [INTOCAVEL]
    → render_template("base.html", ...)  [INTOCAVEL]
    → PDFConverter.html_to_pdf()         [INTOCAVEL]

O QUE MUDA (so o destino dos bytes gerados):
  ANTES: html_content → open(data/outputs/filename, 'wb')
  DEPOIS: html_content → supabase.storage.upload(path, content)
                        → supabase.table('documentos').insert(registro)
```

---

## Fase 1: Schema do Banco de Dados (Supabase Migrations)

Aplicar 10 migrations no projeto Supabase `rvzkszfowlzioddqjryz` via MCP `apply_migration`.

### Tarefas

- [ ] Migration 1: Criar enums e tabela profiles [complexo]
  - [ ] Criar enums: `tipo_tese`, `recuperabilidade`, `user_role`, `status_cliente`, `status_carteira`, `status_caso`, `status_processo`
  - [ ] Criar tabela `profiles` vinculada a `auth.users`
  - [ ] Criar function `update_updated_at_column()` reutilizavel
  - [ ] Criar trigger `on_auth_user_created` para auto-criar profile
- [ ] Migration 2: Criar tabela `clientes` (com UNIQUE em documento)
- [ ] Migration 3: Criar tabela `carteiras` com FK para clientes
- [ ] Migration 4: Criar tabela `casos` com FK para carteiras
- [ ] Migration 5: Criar tabela `processos` com auto-referencia [complexo]
  - [ ] Campo `processo_pai_id` self-referencing nullable
  - [ ] Campo `is_incidental` boolean
  - [ ] Indices detalhados:
    - `idx_processos_caso_id ON processos(caso_id)`
    - `idx_processos_processo_pai_id ON processos(processo_pai_id)`
    - `idx_processos_tipo_tese ON processos(tipo_tese)`
    - `idx_processos_recuperabilidade ON processos(recuperabilidade)`
    - `idx_processos_uf ON processos(uf)`
    - `idx_processos_status ON processos(status)`
    - `idx_processos_data_distribuicao ON processos(data_distribuicao)`
    - `idx_processos_numero_cnj ON processos(numero_cnj)`
- [ ] Migration 6: Criar tabela `documentos` com `processo_id` NULLABLE e `updated_at`
- [ ] Migration 7: Criar tabela `cliente_carteira_access` com UNIQUE constraint
- [ ] Migration 8: Habilitar RLS e criar policies [complexo]
  - [ ] Function helper `is_admin()`
  - [ ] Policies para profiles (own + admin)
  - [ ] Policies para clientes (admin only)
  - [ ] Policies para carteiras (admin + client via access)
  - [ ] Policies para casos (admin + client via carteira access)
  - [ ] Policies para processos (admin + client via caso→carteira access)
  - [ ] Policies para documentos (admin + client via processo→caso→carteira access)
  - [ ] Policies para documentos sem processo (admin only)
  - [ ] Policies para cliente_carteira_access (admin manage + client view own)
- [ ] Migration 9: Criar triggers e functions de dashboard [complexo]
  - [ ] Trigger `update_carteira_caso_count` (AFTER INSERT/UPDATE/DELETE ON casos) — atualiza `qtd_casos`
  - [ ] Trigger `update_carteira_processo_count` (AFTER INSERT/UPDATE/DELETE ON processos) — atualiza `qtd_processos` (via caso→carteira)
  - [ ] Function `get_admin_dashboard_stats()` via RPC
- [ ] Migration 10: Criar bucket Storage e policies
  - [ ] Bucket `documents` (privado, 50MB, mime types restritos)
  - [ ] Policy admins upload/delete/view all
  - [ ] Policy clients view shared documents only

### Detalhes Tecnicos

**Enums:**
```sql
CREATE TYPE public.tipo_tese AS ENUM ('NPL', 'RJ', 'Divida_Ativa', 'Litigio');
CREATE TYPE public.recuperabilidade AS ENUM ('Alta', 'Potencial', 'Critica', 'Indefinida', 'Nenhuma');
CREATE TYPE public.user_role AS ENUM ('admin', 'client');
CREATE TYPE public.status_cliente AS ENUM ('ativo', 'inativo');
CREATE TYPE public.status_carteira AS ENUM ('ativa', 'encerrada', 'em_analise');
CREATE TYPE public.status_caso AS ENUM ('em_andamento', 'concluido', 'arquivado');
CREATE TYPE public.status_processo AS ENUM ('ativo', 'suspenso', 'arquivado', 'encerrado');
```

**Tabela profiles:**
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Trigger auto-criar profile:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Tabela clientes:**
```sql
CREATE TABLE public.clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  documento TEXT UNIQUE,  -- CPF ou CNPJ, UNIQUE constraint
  tipo TEXT NOT NULL CHECK (tipo IN ('PF', 'PJ')) DEFAULT 'PJ',
  status status_cliente NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

**Tabela carteiras:**
```sql
CREATE TABLE public.carteiras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  data_aquisicao DATE,
  valor_total NUMERIC(15,2) DEFAULT 0,
  qtd_casos INTEGER DEFAULT 0,
  qtd_processos INTEGER DEFAULT 0,
  status status_carteira NOT NULL DEFAULT 'em_analise',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_carteiras_cliente_id ON public.carteiras(cliente_id);
CREATE TRIGGER update_carteiras_updated_at BEFORE UPDATE ON public.carteiras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

**Tabela casos:**
```sql
CREATE TABLE public.casos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  carteira_id UUID NOT NULL REFERENCES public.carteiras(id) ON DELETE CASCADE,
  tese tipo_tese,
  credor_principal TEXT,
  devedor_principal TEXT,
  cnpj_cpf_devedor TEXT,
  valor_total NUMERIC(15,2) DEFAULT 0,
  recuperabilidade recuperabilidade,
  uf_principal TEXT,
  observacoes TEXT,
  status status_caso NOT NULL DEFAULT 'em_andamento',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_casos_carteira_id ON public.casos(carteira_id);
CREATE INDEX idx_casos_tese ON public.casos(tese);
CREATE INDEX idx_casos_recuperabilidade ON public.casos(recuperabilidade);
CREATE TRIGGER update_casos_updated_at BEFORE UPDATE ON public.casos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

**Tabela processos (com self-ref):**
```sql
CREATE TABLE public.processos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_cnj TEXT NOT NULL,
  caso_id UUID NOT NULL REFERENCES public.casos(id) ON DELETE CASCADE,
  processo_pai_id UUID REFERENCES public.processos(id) ON DELETE SET NULL,
  tipo_tese tipo_tese,
  tipo_acao TEXT,
  is_incidental BOOLEAN NOT NULL DEFAULT false,
  recuperabilidade recuperabilidade,
  valor_causa NUMERIC(15,2),
  valor_divida NUMERIC(15,2),
  valor_atualizado NUMERIC(15,2),
  polo_ativo TEXT,
  polo_passivo TEXT,
  comarca TEXT,
  vara TEXT,
  tribunal TEXT,
  uf TEXT,
  fase_processual TEXT,
  data_distribuicao DATE,
  ultima_movimentacao TEXT,
  data_ultima_movimentacao DATE,
  data_analise TIMESTAMPTZ,
  observacoes TEXT,
  status status_processo NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_processos_caso_id ON public.processos(caso_id);
CREATE INDEX idx_processos_processo_pai_id ON public.processos(processo_pai_id);
CREATE INDEX idx_processos_tipo_tese ON public.processos(tipo_tese);
CREATE INDEX idx_processos_recuperabilidade ON public.processos(recuperabilidade);
CREATE INDEX idx_processos_uf ON public.processos(uf);
CREATE INDEX idx_processos_status ON public.processos(status);
CREATE INDEX idx_processos_data_distribuicao ON public.processos(data_distribuicao);
CREATE INDEX idx_processos_numero_cnj ON public.processos(numero_cnj);
CREATE TRIGGER update_processos_updated_at BEFORE UPDATE ON public.processos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

**Tabela documentos (processo_id NULLABLE, com updated_at):**
```sql
CREATE TABLE public.documentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id UUID REFERENCES public.processos(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT,
  file_type TEXT NOT NULL CHECK (file_type IN ('html', 'pdf', 'md')),
  storage_path TEXT NOT NULL UNIQUE,
  file_size BIGINT,
  title TEXT,
  theme TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_documentos_processo_id ON public.documentos(processo_id);
CREATE INDEX idx_documentos_created_by ON public.documentos(created_by);
CREATE INDEX idx_documentos_file_type ON public.documentos(file_type);
CREATE TRIGGER update_documentos_updated_at BEFORE UPDATE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

**Tabela cliente_carteira_access:**
```sql
CREATE TABLE public.cliente_carteira_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  carteira_id UUID NOT NULL REFERENCES public.carteiras(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, carteira_id)
);
CREATE INDEX idx_cca_profile_id ON public.cliente_carteira_access(profile_id);
CREATE INDEX idx_cca_carteira_id ON public.cliente_carteira_access(carteira_id);
CREATE INDEX idx_cca_profile_carteira ON public.cliente_carteira_access(profile_id, carteira_id);
```

**RLS helper function:**
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

**RLS policies completas (TODAS as tabelas):**

```sql
-- === PROFILES ===
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR ALL
  USING (is_admin());

-- === CLIENTES (admin only) ===
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to clientes"
  ON public.clientes FOR ALL
  USING (is_admin());

-- === CARTEIRAS ===
ALTER TABLE public.carteiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to carteiras"
  ON public.carteiras FOR ALL
  USING (is_admin());

CREATE POLICY "Clients can view granted carteiras"
  ON public.carteiras FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cliente_carteira_access cca
      WHERE cca.carteira_id = carteiras.id AND cca.profile_id = auth.uid()
    )
  );

-- === CASOS ===
ALTER TABLE public.casos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to casos"
  ON public.casos FOR ALL
  USING (is_admin());

CREATE POLICY "Clients can view casos in granted carteiras"
  ON public.casos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cliente_carteira_access cca
      WHERE cca.carteira_id = casos.carteira_id AND cca.profile_id = auth.uid()
    )
  );

-- === PROCESSOS ===
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to processos"
  ON public.processos FOR ALL
  USING (is_admin());

CREATE POLICY "Clients can view processos in granted carteiras"
  ON public.processos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.casos c
      JOIN public.cliente_carteira_access cca ON cca.carteira_id = c.carteira_id
      WHERE c.id = processos.caso_id AND cca.profile_id = auth.uid()
    )
  );

-- === DOCUMENTOS ===
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to documentos"
  ON public.documentos FOR ALL
  USING (is_admin());

CREATE POLICY "Clients can view documentos in granted carteiras"
  ON public.documentos FOR SELECT
  USING (
    processo_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.processos p
      JOIN public.casos c ON c.id = p.caso_id
      JOIN public.cliente_carteira_access cca ON cca.carteira_id = c.carteira_id
      WHERE p.id = documentos.processo_id AND cca.profile_id = auth.uid()
    )
  );

-- === CLIENTE_CARTEIRA_ACCESS ===
ALTER TABLE public.cliente_carteira_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to cliente_carteira_access"
  ON public.cliente_carteira_access FOR ALL
  USING (is_admin());

CREATE POLICY "Clients can view own access"
  ON public.cliente_carteira_access FOR SELECT
  USING (profile_id = auth.uid());
```

**Trigger update_carteira_caso_count (escuta tabela casos):**
```sql
CREATE OR REPLACE FUNCTION public.update_carteira_caso_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    UPDATE public.carteiras SET qtd_casos = (
      SELECT COUNT(*) FROM public.casos WHERE carteira_id = OLD.carteira_id
    ) WHERE id = OLD.carteira_id;
  END IF;
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.carteiras SET qtd_casos = (
      SELECT COUNT(*) FROM public.casos WHERE carteira_id = NEW.carteira_id
    ) WHERE id = NEW.carteira_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_carteira_caso_count
  AFTER INSERT OR UPDATE OR DELETE ON public.casos
  FOR EACH ROW EXECUTE FUNCTION public.update_carteira_caso_count();
```

**Trigger update_carteira_processo_count (escuta tabela processos via caso→carteira):**
```sql
CREATE OR REPLACE FUNCTION public.update_carteira_processo_count()
RETURNS TRIGGER AS $$
DECLARE
  v_carteira_id UUID;
BEGIN
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    SELECT carteira_id INTO v_carteira_id FROM public.casos WHERE id = OLD.caso_id;
    IF v_carteira_id IS NOT NULL THEN
      UPDATE public.carteiras SET qtd_processos = (
        SELECT COUNT(*) FROM public.processos p
        JOIN public.casos c ON c.id = p.caso_id
        WHERE c.carteira_id = v_carteira_id
      ) WHERE id = v_carteira_id;
    END IF;
  END IF;
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    SELECT carteira_id INTO v_carteira_id FROM public.casos WHERE id = NEW.caso_id;
    IF v_carteira_id IS NOT NULL THEN
      UPDATE public.carteiras SET qtd_processos = (
        SELECT COUNT(*) FROM public.processos p
        JOIN public.casos c ON c.id = p.caso_id
        WHERE c.carteira_id = v_carteira_id
      ) WHERE id = v_carteira_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_carteira_processo_count
  AFTER INSERT OR UPDATE OR DELETE ON public.processos
  FOR EACH ROW EXECUTE FUNCTION public.update_carteira_processo_count();
```

**Dashboard stats function:**
```sql
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'total_clientes', (SELECT COUNT(*) FROM public.clientes WHERE status = 'ativo'),
    'total_carteiras', (SELECT COUNT(*) FROM public.carteiras),
    'total_casos', (SELECT COUNT(*) FROM public.casos),
    'total_processos', (SELECT COUNT(*) FROM public.processos),
    'total_documentos', (SELECT COUNT(*) FROM public.documentos),
    'documentos_este_mes', (
      SELECT COUNT(*) FROM public.documentos
      WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)
    ),
    'distribuicao_tese', (
      SELECT json_agg(json_build_object('tese', tipo_tese, 'count', cnt))
      FROM (SELECT tipo_tese, COUNT(*) as cnt FROM public.casos WHERE tipo_tese IS NOT NULL GROUP BY tipo_tese) sub
    ),
    'distribuicao_recuperabilidade', (
      SELECT json_agg(json_build_object('recuperabilidade', recuperabilidade, 'count', cnt))
      FROM (SELECT recuperabilidade, COUNT(*) as cnt FROM public.processos WHERE recuperabilidade IS NOT NULL GROUP BY recuperabilidade) sub
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Storage bucket:**
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, 52428800,
  ARRAY['text/html', 'application/pdf', 'text/markdown']::text[]);
```

---

## Fase 2: Backend - Dependencias, Auth e Supabase Client

Adicionar dependencias Python, criar modulos de autenticacao e cliente Supabase.

### Tarefas

- [ ] Migrar Dockerfile para UV (substituir `pip install -r requirements.txt`) [CRITICO]
  - [ ] Instalar UV no estagio Python do Dockerfile
  - [ ] Copiar `pyproject.toml` e `uv.lock` em vez de `requirements.txt`
  - [ ] Usar `uv sync --no-dev` para instalar apenas dependencias de producao
  - [ ] Remover `requirements.txt` do repositorio (UV com pyproject.toml e a unica fonte de verdade)
- [ ] Adicionar dependencias no `pyproject.toml`: `supabase>=2.0.0`, `PyJWT[crypto]>=2.8.0`
- [ ] Executar `uv sync` para atualizar lockfile
- [ ] Criar `utils/__init__.py` (vazio)
- [ ] Adicionar configs Supabase em `config.py`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Criar `utils/auth.py` com verificacao JWT e decorators [complexo]
  - [ ] `verify_supabase_token(token)` via JWKS/ES256
  - [ ] `get_user_profile(user_id)` busca no banco
  - [ ] Decorator `@auth_required` - seta `g.user`, `g.user_id`, `g.token`
  - [ ] Decorator `@admin_required` - herda auth_required + verifica role
- [ ] Criar `utils/supabase_client.py` com classe SupabaseService [complexo]
  - [ ] Storage: `upload_file(content, file_type)`, `delete_file(path)`, `get_signed_url(path, expires_in=3600)`
  - [ ] CRUD Clientes: list, get, create, update, delete
  - [ ] CRUD Carteiras: list (com paginacao), get, create, update, delete
  - [ ] CRUD Casos: list (com filtros), get, create, update, delete
  - [ ] CRUD Processos: list (com filtros completos), get (com pai e filhos), create, update, delete
  - [ ] CRUD Documentos: list (com filtros), get, create, delete (DB + Storage)
  - [ ] Acesso: grant_carteira_access, revoke_carteira_access, list_carteira_access, get_client_carteiras
  - [ ] Auth Admin: create_user_account, delete_user_account, reset_user_password, list_user_accounts
  - [ ] Dashboard: get_admin_stats (via RPC)

### Detalhes Tecnicos

**Dockerfile migrado para UV (estagio Python):**
```dockerfile
# Estagio 2: Imagem final com Python + UV + Frontend compilado
FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive

# Instalar dependencias do sistema para WeasyPrint
RUN set -eux && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf-2.0-0 \
    libffi-dev libcairo2 shared-mime-info fonts-dejavu-core gcc \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instalar UV
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copiar arquivos de dependencias e instalar
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-editable

# Copiar codigo da aplicacao
COPY . .

# Copiar frontend compilado
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Criar diretorios
RUN mkdir -p data/uploads data/outputs data/themes templates

EXPOSE 8080
ENV PORT=8080

# Rodar com UV (que usa o venv criado pelo sync)
CMD uv run gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 --access-logfile - --error-logfile - app:app
```

> **CRITICO**: O Dockerfile atual usa `pip install -r requirements.txt`. Sem migrar para UV, as novas dependencias (`supabase`, `PyJWT[crypto]`) adicionadas apenas no `pyproject.toml` NAO serao instaladas no Docker build, causando falha em producao.

**Arquivos a modificar:**
- `Dockerfile` - Migrar estagio Python para UV
- `config.py` - Adicionar `SUPABASE_URL = os.environ.get('SUPABASE_URL')` e `SUPABASE_SERVICE_ROLE_KEY`
- `pyproject.toml` - Adicionar em `[project] dependencies`

**Arquivos a remover:**
- `requirements.txt` - Substituido por `pyproject.toml` + `uv.lock`

**Arquivos novos:**
- `utils/__init__.py`
- `utils/auth.py`
- `utils/supabase_client.py`

**JWT verification (utils/auth.py):**
```python
from jwt import PyJWKClient
import jwt

JWKS_URL = f"{Config.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
jwks_client = PyJWKClient(JWKS_URL, cache_jwk_set=True, lifespan=600)

def verify_supabase_token(token):
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    payload = jwt.decode(token, signing_key.key, algorithms=["ES256"], audience="authenticated")
    return payload
```

**Decorator auth_required:**
```python
def auth_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Token ausente'}), 401
        token = auth_header.split(' ')[1]
        payload = verify_supabase_token(token)
        if not payload:
            return jsonify({'error': 'Token invalido'}), 401
        g.user = get_user_profile(payload['sub'])
        g.user_id = payload['sub']
        g.token = token
        return f(*args, **kwargs)
    return decorated
```

**Supabase client init:**
```python
from supabase import create_client
supabase_admin = create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_ROLE_KEY)
```

**Variaveis de ambiente (ja existem no Railway/GitHub):**
- `SUPABASE_URL` = `https://rvzkszfowlzioddqjryz.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_aLHe6WDEWoczDo0Ah2Ksrg_rckvR5n8`

---

## Fase 3: Backend - Refatorar app.py com Blueprints

Extrair logica do `app.py` (889 linhas) para Flask Blueprints. A logica de conversao e temas e COPIADA (nao reescrita) para os blueprints.

### Tarefas

- [ ] Criar `routes/__init__.py` com `register_blueprints(app)` [complexo]
- [ ] Criar `routes/auth_routes.py` - health check (publico) + GET /api/me (auth)
- [ ] Criar `routes/convert_routes.py` - COPIAR logica de conversao do app.py [complexo]
  - [ ] POST /api/convert (admin_required) - mesma logica + upload Storage + registro DB
  - [ ] POST /api/convert/file (admin_required) - mesma logica + upload Storage + registro DB
  - [ ] POST /api/convert/pdf (admin_required) - mesma logica + upload Storage + registro DB
  - [ ] POST /api/convert/file/pdf (admin_required) - mesma logica + upload Storage + registro DB
  - [ ] Campo `processo_id` opcional no request
  - [ ] Campo `title` opcional no request
  - [ ] Response preserva formato original + novos campos (document_id, signed_url)
- [ ] Criar `routes/themes_routes.py` - COPIAR logica de temas do app.py [complexo]
  - [ ] GET /api/themes (admin_required) - IDENTICO ao app.py
  - [ ] POST /api/themes (admin_required) - IDENTICO ao app.py
  - [ ] PUT /api/themes/<name> (admin_required) - IDENTICO ao app.py
  - [ ] DELETE /api/themes/<name> (admin_required) - IDENTICO ao app.py
  - [ ] PATCH /api/themes/<name>/rename (admin_required) - IDENTICO ao app.py
  - [ ] Temas operam 100% no filesystem, sem Supabase
- [ ] Criar `routes/files_routes.py` - download e preview via Supabase Storage
  - [ ] GET /api/download/<document_id> (auth_required) - redirect signed URL
  - [ ] GET /api/preview/<document_id> (auth_required) - retorna signed URL para HTML
  - [ ] GET /api/generate-pdf/<document_id> (admin_required) - baixa HTML, converte PDF, upload
- [ ] Criar `routes/clientes_routes.py` - CRUD clientes (admin_required)
- [ ] Criar `routes/carteiras_routes.py` - CRUD carteiras (auth_required / admin para write)
- [ ] Criar `routes/casos_routes.py` - CRUD casos com filtros (auth_required / admin para write)
- [ ] Criar `routes/processos_routes.py` - CRUD processos com filtros completos (auth_required / admin para write) [complexo]
- [ ] Criar `routes/documentos_routes.py` - lista/detalhe/delete documentos (auth_required / admin para delete) [complexo]
  - [ ] GET /api/documentos - lista com filtros (processo_id, search, file_type, sem_processo)
  - [ ] GET /api/documentos/<id> - detalhe + signed URL
  - [ ] PUT /api/documentos/<id> - vincular a processo (admin)
  - [ ] DELETE /api/documentos/<id> - remove DB + Storage (admin)
- [ ] Criar `routes/dashboard_routes.py` - stats admin e cliente
  - [ ] GET /api/dashboard/stats (admin_required) - via RPC get_admin_dashboard_stats()
  - [ ] GET /api/dashboard/recent (admin_required) - ultimos 10 documentos
  - [ ] GET /api/dashboard/client (auth_required) - stats do cliente
- [ ] Criar `routes/sharing_routes.py` - acesso carteiras + contas [complexo]
  - [ ] GET /api/sharing/carteira/<id> (admin) - listar acessos
  - [ ] POST /api/sharing/carteira/<id> (admin) - conceder acesso
  - [ ] DELETE /api/sharing/carteira/<id>/<profile_id> (admin) - revogar
  - [ ] POST /api/accounts (admin) - criar conta usuario
  - [ ] GET /api/accounts (admin) - listar contas
  - [ ] DELETE /api/accounts/<id> (admin) - remover conta
  - [ ] PUT /api/accounts/<id>/password (admin) - resetar senha
- [ ] Refatorar `app.py` para factory pattern `create_app()` [complexo]
  - [ ] Manter criacao de pastas (UPLOAD_FOLDER, CUSTOM_THEMES_FOLDER, OUTPUT_FOLDER)
  - [ ] Registrar todos os blueprints
  - [ ] Serve frontend SPA com catch-all para React Router
  - [ ] Manter `app = create_app()` no final para gunicorn
- [ ] Adaptar `tests/conftest.py` com mock fixtures
  - [ ] Fixture `mock_auth` (monkeypatch verify_supabase_token + get_user_profile)
  - [ ] Fixture `mock_supabase` (monkeypatch upload_file + create_documento + get_signed_url)
- [ ] Adaptar `tests/test_api_integration.py` com auth headers (dependem de mock_auth e mock_supabase)
- [ ] Verificar que `tests/test_converter.py` passa SEM MUDANCA (14 testes)
- [ ] Executar `uv run ruff check . && uv run ruff format .`
- [ ] Executar `uv run pytest tests/ -v` - todos os testes passam

### Detalhes Tecnicos

**Estrutura de arquivos (novos):**
```
routes/
  __init__.py              # register_blueprints()
  auth_routes.py           # health + me
  convert_routes.py        # conversao MD→HTML/PDF + Storage
  files_routes.py          # download + preview via Storage
  themes_routes.py         # CRUD temas (filesystem)
  clientes_routes.py       # CRUD clientes
  carteiras_routes.py      # CRUD carteiras
  casos_routes.py          # CRUD casos
  processos_routes.py      # CRUD processos
  documentos_routes.py     # lista/detalhe/delete documentos
  dashboard_routes.py      # stats admin + client
  sharing_routes.py        # acesso carteiras + contas
```

**app.py refatorado:**
```python
def create_app():
    app = Flask(__name__, static_folder="frontend/dist", static_url_path="")
    CORS(app)
    app.config.from_object(Config)
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(Config.CUSTOM_THEMES_FOLDER, exist_ok=True)
    os.makedirs(Config.OUTPUT_FOLDER, exist_ok=True)
    from routes import register_blueprints
    register_blueprints(app)
    # Serve frontend SPA (catch-all React Router)
    @app.route("/")
    @app.route("/<path:path>")
    def serve_frontend(path=""):
        if path.startswith("api/"):
            return jsonify({"error": "Not found"}), 404
        if os.path.exists(os.path.join("frontend/dist", path)):
            return send_from_directory("frontend/dist", path)
        if os.path.exists("frontend/dist/index.html"):
            return send_from_directory("frontend/dist", "index.html")
        return jsonify({"message": "Axion Viewer API", "version": "3.0.0"}), 200
    return app

app = create_app()
```

**convert_routes.py - padrao de cada endpoint:**
```python
@convert_bp.route('/convert', methods=['POST'])
@admin_required
def convert_markdown():
    # PARTE 1: LOGICA ORIGINAL (copy-paste do app.py)
    data = request.get_json()
    markdown_text = data.get('markdown')
    # ... validacao, theme, custom_config, convert, extract, render_template ...
    # (IDENTICO ao app.py atual)

    # PARTE 2: NOVA - upload Storage + registro DB (com cleanup atomico)
    storage_path = supa_service.upload_file(rendered_html.encode('utf-8'), 'html')
    try:
        doc_record = supa_service.create_documento({
            'processo_id': data.get('processo_id'),  # OPCIONAL
            'filename': filename,
            'file_type': 'html',
            'storage_path': storage_path,
            'file_size': len(rendered_html.encode('utf-8')),
            'title': data.get('title', title),
            'theme': theme_name,
            'created_by': g.user_id
        })
    except Exception:
        # Cleanup: remove arquivo orfao do Storage se INSERT falhar
        supa_service.delete_file(storage_path)
        raise
    signed_url = supa_service.get_signed_url(storage_path)

    # RESPOSTA: formato original + novos campos
    return jsonify({
        'success': True,
        'html': rendered_html,
        'filename': filename,
        'download_url': f'/api/download/{doc_record.data[0]["id"]}',
        'metadata': { 'title': title, 'theme': theme_name, 'generated_at': datetime.now().isoformat() },
        'document_id': doc_record.data[0]['id'],
        'signed_url': signed_url
    })
```

**themes_routes.py - temas 100% filesystem:**
```python
theme_manager = ThemeManager(custom_themes_folder=Config.CUSTOM_THEMES_FOLDER)

@themes_bp.route('/themes', methods=['GET'])
@admin_required  # UNICA MUDANCA: auth decorator
def list_themes():
    # Logica IDENTICA ao app.py atual (copy-paste)
    ...
```

**Tabela de endpoints por blueprint:**

| Blueprint | Metodo | Rota | Acesso |
|-----------|--------|------|--------|
| auth | GET | /api/health | Publico |
| auth | GET | /api/me | auth_required |
| convert | POST | /api/convert | admin_required |
| convert | POST | /api/convert/file | admin_required |
| convert | POST | /api/convert/pdf | admin_required |
| convert | POST | /api/convert/file/pdf | admin_required |
| files | GET | /api/download/\<id\> | auth_required |
| files | GET | /api/preview/\<id\> | auth_required |
| files | GET | /api/generate-pdf/\<id\> | admin_required |
| themes | GET | /api/themes | admin_required |
| themes | POST | /api/themes | admin_required |
| themes | PUT | /api/themes/\<name\> | admin_required |
| themes | DELETE | /api/themes/\<name\> | admin_required |
| themes | PATCH | /api/themes/\<name\>/rename | admin_required |
| clientes | GET | /api/clientes | admin_required |
| clientes | POST | /api/clientes | admin_required |
| clientes | GET | /api/clientes/\<id\> | admin_required |
| clientes | PUT | /api/clientes/\<id\> | admin_required |
| clientes | DELETE | /api/clientes/\<id\> | admin_required |
| carteiras | GET | /api/carteiras | auth_required |
| carteiras | POST | /api/carteiras | admin_required |
| carteiras | GET | /api/carteiras/\<id\> | auth_required |
| carteiras | PUT | /api/carteiras/\<id\> | admin_required |
| carteiras | DELETE | /api/carteiras/\<id\> | admin_required |
| casos | GET | /api/casos | auth_required |
| casos | POST | /api/casos | admin_required |
| casos | GET | /api/casos/\<id\> | auth_required |
| casos | PUT | /api/casos/\<id\> | admin_required |
| casos | DELETE | /api/casos/\<id\> | admin_required |
| processos | GET | /api/processos | auth_required |
| processos | POST | /api/processos | admin_required |
| processos | GET | /api/processos/\<id\> | auth_required |
| processos | PUT | /api/processos/\<id\> | admin_required |
| processos | DELETE | /api/processos/\<id\> | admin_required |
| documentos | GET | /api/documentos | auth_required |
| documentos | GET | /api/documentos/\<id\> | auth_required |
| documentos | PUT | /api/documentos/\<id\> | admin_required |
| documentos | DELETE | /api/documentos/\<id\> | admin_required |
| dashboard | GET | /api/dashboard/stats | admin_required |
| dashboard | GET | /api/dashboard/recent | admin_required |
| dashboard | GET | /api/dashboard/client | auth_required |
| sharing | GET | /api/sharing/carteira/\<id\> | admin_required |
| sharing | POST | /api/sharing/carteira/\<id\> | admin_required |
| sharing | DELETE | /api/sharing/carteira/\<id\>/\<pid\> | admin_required |
| sharing | POST | /api/accounts | admin_required |
| sharing | GET | /api/accounts | admin_required |
| sharing | DELETE | /api/accounts/\<id\> | admin_required |
| sharing | PUT | /api/accounts/\<id\>/password | admin_required |

**Padrao de paginacao e filtros (todos os endpoints de listagem):**
```python
# Parametros aceitos em query string:
# page (int, default=1), per_page (int, default=20, max=100)
# sort_field (str, default='created_at'), sort_order (str, default='desc')
# search (str, opcional - ILIKE em campos relevantes)
# + filtros especificos por entidade (ex: tipo_tese, recuperabilidade, uf)

def paginate_query(query_builder, page=1, per_page=20):
    """Aplica paginacao ao query builder do Supabase."""
    start = (page - 1) * per_page
    end = start + per_page - 1
    return query_builder.range(start, end)

# Response padrao paginado:
# {
#   "data": [...],
#   "pagination": {
#     "page": 1, "per_page": 20, "total": 150, "total_pages": 8
#   }
# }
```

**Padrao de busca textual (ILIKE):**
```python
# Para processos: busca em numero_cnj, polo_ativo, polo_passivo, comarca
# Para clientes: busca em nome, email, documento
# Para casos: busca em nome, credor_principal, devedor_principal

def apply_search(query_builder, search_term, fields):
    """Aplica busca ILIKE em multiplos campos via OR."""
    if not search_term:
        return query_builder
    # Supabase Python: .or_('campo1.ilike.%term%,campo2.ilike.%term%')
    conditions = ','.join(f'{f}.ilike.%{search_term}%' for f in fields)
    return query_builder.or_(conditions)
```

**Cleanup de Storage em DELETE de documentos:**
```python
@documentos_bp.route('/documentos/<id>', methods=['DELETE'])
@admin_required
def delete_documento(id):
    # 1. Buscar documento para obter storage_path
    doc = supa_service.get_documento(id)
    if not doc:
        return jsonify({'error': 'Documento nao encontrado'}), 404
    # 2. Deletar do Storage PRIMEIRO
    supa_service.delete_file(doc['storage_path'])
    # 3. Deletar registro do banco
    supa_service.delete_documento(id)
    return jsonify({'success': True})
```

**Fixtures de teste (conftest.py):**
```python
@pytest.fixture
def mock_auth(monkeypatch):
    monkeypatch.setattr('utils.auth.verify_supabase_token',
        lambda t: {'sub': 'test-user-id'})
    monkeypatch.setattr('utils.auth.get_user_profile',
        lambda uid: {'id': uid, 'role': 'admin', 'email': 'test@test.com'})

@pytest.fixture
def mock_supabase(monkeypatch):
    monkeypatch.setattr('utils.supabase_client.supa_service.upload_file',
        lambda content, ft: f'mock/{ft}/test.{ft}')
    monkeypatch.setattr('utils.supabase_client.supa_service.create_documento',
        lambda data: MagicMock(data=[{'id': 'mock-doc-id'}]))
    monkeypatch.setattr('utils.supabase_client.supa_service.get_signed_url',
        lambda path, **kw: 'https://mock-signed-url.com')
```

---

## Fase 4: Frontend - Infraestrutura e Auth

Instalar dependencias, configurar Supabase client, AuthContext, React Router e Layout.

### Tarefas

- [ ] Instalar dependencias: `pnpm add @supabase/supabase-js react-router-dom@6`
- [ ] Criar `frontend/src/lib/supabase.js` - cliente Supabase JS
- [ ] Criar `frontend/src/lib/api.js` - Axios instance com JWT interceptor [complexo]
  - [ ] Interceptor de request injeta `Authorization: Bearer {token}`
  - [ ] Token obtido de `supabase.auth.getSession()`
  - [ ] Interceptor de response trata 401 (redirect login)
- [ ] Criar `frontend/src/contexts/AuthContext.jsx` [complexo]
  - [ ] State: user, profile, loading, error
  - [ ] Computed: isAdmin, isClient
  - [ ] Methods: signIn(email, password), signOut()
  - [ ] Effect: onAuthStateChange listener
  - [ ] Effect: fetch profile via Supabase JS client direto (`supabase.from('profiles').select('*').eq('id', user.id).single()`) — NAO depende do backend Flask para auth funcionar
  - [ ] Fallback: se Supabase direto falhar, tentar /api/me
- [ ] Criar `frontend/src/hooks/useAuth.js` - re-export do context
- [ ] Criar `frontend/src/components/ProtectedRoute.jsx` - guards de rota
  - [ ] Redirect para /login se nao autenticado
  - [ ] AdminRoute verifica role admin
- [ ] Criar `frontend/src/components/Layout.jsx` [complexo]
  - [ ] Sidebar com navegacao por role (admin vs client)
  - [ ] Header com nome usuario, role badge, botao logout
  - [ ] Breadcrumb dinamico baseado na rota
  - [ ] `<Outlet>` para conteudo das paginas
  - [ ] Sidebar colapsavel com hamburger menu em telas < 768px (responsividade mobile)
  - [ ] Grid responsivo para cards (1 col mobile, 2 tablet, 3+ desktop)
- [ ] Criar `frontend/src/pages/LoginPage.jsx` - form email/senha
- [ ] Criar `frontend/src/pages/NotFoundPage.jsx` - 404
- [ ] Reescrever `frontend/src/App.jsx` com React Router [complexo]
  - [ ] BrowserRouter no main.jsx com AuthProvider
  - [ ] Rotas publicas: /login
  - [ ] Rotas protegidas: / (dashboard por role)
  - [ ] Rotas admin: /admin/*
  - [ ] Rotas client: /carteiras/*, /casos/*, /processos/*
  - [ ] Catch-all: 404
- [ ] Criar componentes compartilhados
  - [ ] `LoadingSpinner.jsx`
  - [ ] `Pagination.jsx`
  - [ ] `EmptyState.jsx`
  - [ ] `ConfirmDialog.jsx`
- [ ] Criar testes frontend minimos (Vitest)
  - [ ] `AuthContext.test.jsx` - testa login, logout, state management
  - [ ] `ProtectedRoute.test.jsx` - testa redirect para login quando nao autenticado
  - [ ] `LoginPage.test.jsx` - testa renderizacao e submit do form
  - [ ] `Layout.test.jsx` - testa renderizacao por role (admin vs client)

### Detalhes Tecnicos

**Supabase client (lib/supabase.js):**
```javascript
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

> **IMPORTANTE**: Sem `autoRefreshToken: true` e `persistSession: true`, o requisito "sessao persiste no frontend (refresh token)" NAO sera atendido. O token expira e o usuario seria deslogado.

**Axios interceptor (lib/api.js):**
```javascript
import axios from 'axios';
import { supabase } from './supabase';
const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});
export default api;
```

**Routing (App.jsx):**
```
/login                          -> LoginPage
/                               -> Dashboard (admin ou client conforme role)
/admin/clientes                 -> ClientesPage
/admin/carteiras                -> CarteirasPage
/admin/carteiras/:id/casos      -> CasosPage
/admin/casos                    -> CasosPage
/admin/casos/:id/processos      -> ProcessosPage
/admin/processos                -> ProcessosPage
/admin/processos/:id            -> ProcessoDetail
/admin/documentos               -> DocumentosPage
/admin/convert                  -> ConvertPage
/admin/themes                   -> ThemesPage
/admin/accounts                 -> AccountsPage
/admin/sharing                  -> SharingPage
/carteiras                      -> ClientCarteirasPage
/carteiras/:id/casos            -> ClientCasosPage
/casos/:id/processos            -> ClientProcessosPage
/processos/:id                  -> ClientProcessoDetail
```

**Sidebar admin:**
- Dashboard, Clientes, Carteiras, Casos, Processos, Documentos, Converter, Temas, Contas, Compartilhamento

**Sidebar client:**
- Dashboard, Minhas Carteiras

---

## Fase 5: Frontend - Paginas Admin

Criar todas as paginas do painel administrativo.

### Tarefas

- [ ] Criar `pages/admin/AdminDashboard.jsx` [complexo]
  - [ ] Cards de estatisticas (GET /api/dashboard/stats)
  - [ ] Grafico distribuicao por tese
  - [ ] Grafico distribuicao por recuperabilidade
  - [ ] Lista atividade recente (GET /api/dashboard/recent)
  - [ ] Botoes de acoes rapidas
- [ ] Criar `pages/admin/ClientesPage.jsx` + `ClienteFormModal.jsx`
  - [ ] Lista com busca
  - [ ] Modal criar/editar (nome, email, telefone, documento, tipo PF/PJ)
  - [ ] Botao excluir com confirmacao
- [ ] Criar `pages/admin/CarteirasPage.jsx` + `CarteiraFormModal.jsx`
  - [ ] Lista com filtro por cliente
  - [ ] Modal criar/editar (nome, descricao, cliente_id, data_aquisicao, status)
  - [ ] Exibe contadores (qtd_casos, qtd_processos)
- [ ] Criar `pages/admin/CasosPage.jsx` + `CasoFormModal.jsx`
  - [ ] Lista com filtros (carteira_id, tese, recuperabilidade, status)
  - [ ] Modal criar/editar (nome, descricao, carteira_id, tese, credor, devedor, etc.)
- [ ] Criar `pages/admin/ProcessosPage.jsx` + `ProcessoFormModal.jsx` [complexo]
  - [ ] Lista com filtros completos do PRD
  - [ ] Modal com todos os campos do processo
  - [ ] Campo processo_pai_id para processos incidentais
  - [ ] Checkbox is_incidental
- [ ] Criar `pages/admin/ProcessoDetail.jsx` [complexo]
  - [ ] Dados completos do processo
  - [ ] Lista de documentos vinculados
  - [ ] Lista de processos incidentais (filhos)
  - [ ] Botao vincular documento existente
- [ ] Criar `pages/admin/DocumentosPage.jsx` [complexo]
  - [ ] Lista todos os documentos com filtros (processo_id, search, file_type)
  - [ ] Filtro especial: documentos sem processo (para vincular)
  - [ ] Acoes: vincular a processo, preview, download, excluir
- [ ] Criar `pages/admin/ConvertPage.jsx` - editor markdown + conversao
  - [ ] MESMA LOGICA do MarkdownEditor.jsx atual
  - [ ] Campo processo_id opcional (select ou input)
  - [ ] Campo title opcional
  - [ ] Usa api.js (com auth header automatico)
- [ ] Criar `pages/admin/ThemesPage.jsx` - editor de temas
  - [ ] MESMA LOGICA do ThemeManager.jsx atual
  - [ ] Usa api.js (com auth header automatico)
- [ ] Criar `pages/admin/AccountsPage.jsx` [complexo]
  - [ ] Lista contas de usuario (profiles com role=client)
  - [ ] Criar nova conta (email, senha, nome)
  - [ ] Resetar senha
  - [ ] Excluir conta
- [ ] Criar `pages/admin/SharingPage.jsx` [complexo]
  - [ ] Selecionar carteira
  - [ ] Lista profiles com acesso
  - [ ] Conceder acesso (selecionar profile)
  - [ ] Revogar acesso

### Detalhes Tecnicos

**Componentes de paginas ficam em:**
```
frontend/src/pages/admin/
  AdminDashboard.jsx
  ClientesPage.jsx
  ClienteFormModal.jsx
  CarteirasPage.jsx
  CarteiraFormModal.jsx
  CasosPage.jsx
  CasoFormModal.jsx
  ProcessosPage.jsx
  ProcessoFormModal.jsx
  ProcessoDetail.jsx
  DocumentosPage.jsx
  ConvertPage.jsx
  ThemesPage.jsx
  AccountsPage.jsx
  SharingPage.jsx
```

**Destino dos componentes existentes:**

| Componente Atual | Destino | Acao |
|-----------------|---------|------|
| `MarkdownEditor.jsx` | `ConvertPage.jsx` | Copiar logica, adicionar campos processo_id/title |
| `ThemeManager.jsx` | `ThemesPage.jsx` | Copiar logica, trocar axios por api.js |
| `FileManager.jsx` | `DocumentosPage.jsx` | Substituir (nova interface com filtros) |
| `FileUpload.jsx` | `ConvertPage.jsx` | Incorporar no ConvertPage |
| `ApiDocs.jsx` | Removido | Substituido por dashboard |
| `ThemeSelector.jsx` | Componente compartilhado | Reutilizado em ConvertPage |
| `App.jsx` | Reescrito | React Router substitui tabs |

Os arquivos originais em `frontend/src/components/` sao MANTIDOS ate que todas as paginas novas estejam funcionais. Removidos em commit separado apos validacao.

**Padrao de pagina CRUD:**
```jsx
// Exemplo ClientesPage.jsx
const ClientesPage = () => {
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => { fetchClientes(); }, [search]);

  const fetchClientes = async () => {
    const res = await api.get('/clientes', { params: { search } });
    setClientes(res.data.data);
  };

  return (
    <div>
      <SearchBar onSearch={setSearch} />
      <Button onClick={() => setModalOpen(true)}>Novo Cliente</Button>
      <Table data={clientes} onEdit={setEditing} onDelete={handleDelete} />
      <ClienteFormModal open={modalOpen} editing={editing} onSave={handleSave} />
    </div>
  );
};
```

---

## Fase 6: Frontend - Paginas Cliente

Criar paginas do painel do cliente com dashboard e navegacao hierarquica.

### Tarefas

- [ ] Criar `pages/client/ClientDashboard.jsx` [complexo]
  - [ ] Cards resumo (carteiras com acesso, total casos, total processos)
  - [ ] Lista de carteiras com cards visuais (nome, qtd, valor)
  - [ ] Atalhos para carteiras
- [ ] Criar `pages/client/ClientCarteirasPage.jsx`
  - [ ] Lista carteiras com acesso (GET /api/carteiras)
  - [ ] Cards com resumo de cada carteira
  - [ ] Click navega para casos
- [ ] Criar `pages/client/ClientCasosPage.jsx`
  - [ ] Lista casos da carteira selecionada
  - [ ] Filtros: tese, recuperabilidade, status
  - [ ] Click navega para processos
- [ ] Criar `pages/client/ClientProcessosPage.jsx` [complexo]
  - [ ] Lista processos do caso selecionado
  - [ ] Filtros completos do PRD:
    - [ ] Busca textual (CNJ, partes, comarca)
    - [ ] Tipo de tese
    - [ ] Recuperabilidade
    - [ ] Faixa de valor (min/max)
    - [ ] Comarca/jurisdicao
    - [ ] Periodo (data distribuicao)
    - [ ] Ordenacao por multiplos campos
  - [ ] Paginacao (20 por pagina)
- [ ] Criar `pages/client/ClientProcessoDetail.jsx` [complexo]
  - [ ] Todos os dados do processo
  - [ ] Lista de documentos com botoes download/preview
  - [ ] Download via signed URL (redirect)
  - [ ] Preview HTML via signed URL (iframe ou nova aba)
  - [ ] Lista de processos incidentais (filhos)
  - [ ] Navegacao para processo pai (se incidental)

### Detalhes Tecnicos

**Componentes ficam em:**
```
frontend/src/pages/client/
  ClientDashboard.jsx
  ClientCarteirasPage.jsx
  ClientCasosPage.jsx
  ClientProcessosPage.jsx
  ClientProcessoDetail.jsx
```

**Navegacao drill-down:**
```
/ (ClientDashboard)
  → /carteiras (ClientCarteirasPage)
    → /carteiras/:id/casos (ClientCasosPage)
      → /casos/:id/processos (ClientProcessosPage)
        → /processos/:id (ClientProcessoDetail)
          → download/preview documentos (signed URL)
```

**Filtros do PRD (ClientProcessosPage):**
```jsx
const filters = {
  search: '',          // texto livre (CNJ, partes, comarca)
  tipo_tese: '',       // enum: NPL, RJ, Divida_Ativa, Litigio
  recuperabilidade: '',// enum: Alta, Potencial, Critica, Indefinida, Nenhuma
  valor_min: null,     // NUMERIC
  valor_max: null,     // NUMERIC
  uf: '',              // estado
  data_inicio: null,   // DATE
  data_fim: null,      // DATE
  sort_field: 'created_at',
  sort_order: 'desc',
  page: 1,
  per_page: 20
};
```

---

## Fase 7: Migracao de Arquivos e Deploy

Migrar arquivos existentes do filesystem para Supabase Storage e fazer deploy.

### Tarefas

- [ ] Criar/reescrever `scripts/migrate_files.py` [complexo]
  - [ ] Cria cliente placeholder "Documentos Migrados"
  - [ ] Cria carteira "Migracao Automatica"
  - [ ] Cria caso "Documentos Pre-Migracao"
  - [ ] Cria processo placeholder "0000000-00.0000.0.00.0000"
  - [ ] Para cada arquivo em data/outputs/: upload + registro DB
  - [ ] Report sucesso/erros
  - [ ] NAO deleta arquivos locais (backup)
- [ ] Atualizar `docker-compose.yml` com env vars Supabase
- [ ] Executar lint e format: `uv run ruff check . --fix && uv run ruff format .`
- [ ] Executar todos os testes: `uv run pytest tests/ -v`
- [ ] Executar lint frontend: `cd frontend && pnpm lint`
- [ ] Build frontend: `cd frontend && pnpm build`
- [ ] Verificar que docker build funciona localmente

### Detalhes Tecnicos

**Script de migracao:**
```python
#!/usr/bin/env python3
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config
from utils.supabase_client import supa_service

def migrate():
    output_folder = Config.OUTPUT_FOLDER
    files = [f for f in os.listdir(output_folder) if os.path.isfile(os.path.join(output_folder, f))]
    if not files:
        print("Nenhum arquivo para migrar.")
        return

    # Criar hierarquia placeholder
    cliente = supa_service.create_cliente({'nome': 'Documentos Migrados', 'tipo': 'PJ', 'status': 'ativo'}).data[0]
    carteira = supa_service.create_carteira({'nome': 'Migracao Automatica', 'cliente_id': cliente['id'], 'status': 'ativa'}).data[0]
    caso = supa_service.create_caso({'nome': 'Documentos Pre-Migracao', 'carteira_id': carteira['id'], 'status': 'em_andamento'}).data[0]
    processo = supa_service.create_processo({'numero_cnj': '0000000-00.0000.0.00.0000', 'caso_id': caso['id'], 'tipo_acao': 'Migracao', 'status': 'ativo'}).data[0]

    for filename in files:
        filepath = os.path.join(output_folder, filename)
        file_type = 'pdf' if filename.endswith('.pdf') else 'html'
        with open(filepath, 'rb') as f:
            content = f.read()
        storage_path = supa_service.upload_file(content, file_type)
        supa_service.create_documento({
            'processo_id': processo['id'],
            'filename': filename,
            'file_type': file_type,
            'storage_path': storage_path,
            'file_size': len(content),
            'title': filename.replace('.html', '').replace('.pdf', '')
        })
        print(f"  Migrado: {filename} -> {storage_path}")

if __name__ == '__main__':
    migrate()
```

**docker-compose.yml - adicionar:**
```yaml
environment:
  - SUPABASE_URL=${SUPABASE_URL}
  - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
```

**Execucao migracao producao:**
```bash
railway run python scripts/migrate_files.py
```

**Checklist de verificacao final:**
- Todos os testes backend passam
- Frontend builda sem erros
- Docker build funciona localmente
- Login admin funciona
- Conversao MD→HTML gera documento no Storage
- Conversao MD→PDF gera HTML+PDF no Storage
- Temas listam e criam corretamente (filesystem)
- CRUD clientes/carteiras/casos/processos funciona
- Documentos sem processo aparecem para vincular
- Compartilhamento de carteira funciona
- Login cliente funciona
- Cliente ve apenas carteiras com acesso
- Filtros completos funcionam
- Download/preview via signed URL funciona

---

## Riscos e Plano de Rollback

### Riscos por Fase

| Fase | Risco | Probabilidade | Impacto | Mitigacao |
|------|-------|--------------|---------|-----------|
| 1 (Schema) | RLS policies com JOINs de 3 niveis lentas | Media | Alto | Indices explicitos em TODOS os campos de JOIN; testar com dados de exemplo |
| 2 (Auth) | Dockerfile UV quebra build de producao | Baixa | Critico | Testar docker build localmente ANTES de push; manter branch com Dockerfile antigo |
| 3 (Blueprints) | Regressao nos testes existentes | Alta | Alto | Executar testes apos CADA blueprint; manter app.py original em branch separada |
| 4 (Frontend) | Token JWT expira e nao renova | Media | Alto | Opcoes `autoRefreshToken: true` no Supabase client; testar sessao longa |
| 5-6 (Pages) | Componentes orfaos apos reescrita | Baixa | Baixo | Manter originais ate validacao; remover em commit separado |
| 7 (Migracao) | Arquivos corrompidos no upload | Baixa | Critico | Backup obrigatorio; NAO deletar locais; validar checksum apos upload |

### Plano de Rollback

**Se Ciclo 1 falhar (schema/auth/blueprints):**
1. As migrations Supabase podem ser revertidas individualmente via `DROP TABLE/TYPE`
2. O `app.py` original pode ser restaurado do git (`git checkout main -- app.py`)
3. O Dockerfile antigo pode ser restaurado do git
4. Nenhum dado de producao e afetado (schema novo e independente)

**Se Ciclo 2 falhar (admin CRUD):**
1. Remover blueprints de CRUD (rotas novas nao afetam as existentes)
2. Frontend admin pode ser desabilitado sem afetar API de conversao

**Se Ciclo 3 falhar (frontend/migracao):**
1. Frontend pode ser revertido ao tab-based (git checkout)
2. Migracao de Storage: arquivos locais preservados, pode voltar a servir do filesystem
3. `data/outputs/` continua existindo no volume Railway

### Invariantes de Seguranca

Em NENHUM cenario de rollback:
- Os arquivos `utils/markdown_converter.py`, `utils/pdf_converter.py`, `utils/theme_manager.py` sao modificados
- Os testes `tests/test_converter.py` deixam de passar
- O pipeline de conversao MD→HTML→PDF para de funcionar
- Dados de producao sao perdidos (backup obrigatorio antes de migracao)
