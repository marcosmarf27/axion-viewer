# Plano de Implementação: Área do Cliente com Autenticação Supabase

## Visão Geral

Migrar o sistema atual (sem autenticação, arquivos em disco local) para um sistema com:
- Autenticação via Supabase Auth (TODOS os endpoints exceto `/api/health`)
- Banco de dados PostgreSQL (Supabase) para metadados
- **Supabase Storage** para armazenamento de arquivos HTML/PDF
- Row Level Security (RLS) para controle de acesso
- Área admin para gerenciar clientes e compartilhar documentos
- Área cliente para visualizar documentos compartilhados
- Migração de arquivos existentes de `data/outputs/` para o Storage

## Ambiente de Produção (Railway)

> **IMPORTANTE**: A aplicação já está em produção na Railway.

| Item | Valor |
|------|-------|
| **Plataforma** | Railway |
| **Volume** | `/app/data` (50GB) |
| **Arquivos existentes** | `/app/data/outputs/` |
| **CI/CD** | GitHub Actions → Docker image → Railway |

**Fluxo de deploy:**
```
git push → GitHub Actions (build image) → Railway (deploy)
```

As variáveis `VITE_*` devem ser passadas como build args no GitHub Actions, pois são injetadas durante o build do frontend.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Login     │  │   Admin     │  │      Cliente        │  │
│  │   Page      │  │  Dashboard  │  │     Dashboard       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Supabase Auth (JWT)                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕ JWT Token
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Flask)                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  @auth_required / @admin_required (verificar JWT)      │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Conversão: MD → HTML/PDF → Upload Storage → Registro  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   DATABASE (PostgreSQL)               │   │
│  │  ┌──────────┐  ┌───────────┐  ┌─────────────────┐    │   │
│  │  │ profiles │  │ documents │  │ document_shares │    │   │
│  │  └──────────┘  └───────────┘  └─────────────────┘    │   │
│  │                  + RLS Policies                       │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   STORAGE                             │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Bucket: documents (privado)                    │  │   │
│  │  │  - /html/relatorio_*.html                       │  │   │
│  │  │  - /pdf/relatorio_*.pdf                         │  │   │
│  │  │  + RLS Policies para acesso                     │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Fluxo de Conversão (Atualizado)

```
1. **ADMIN** autenticado envia POST /api/convert (clientes recebem 403)
2. Backend valida JWT → verifica role = 'admin'
3. Markdown é convertido para HTML (e opcionalmente PDF)
4. Arquivo é enviado para Supabase Storage:
   - HTML: documents/html/{uuid}.html
   - PDF:  documents/pdf/{uuid}.pdf
5. Registro criado na tabela documents com storage_path
6. Retorna URL do documento (signed URL ou ID para download)
7. Admin pode então compartilhar o documento com clientes
```

## Fluxo de Download (Atualizado)

```
1. Cliente autenticado envia GET /api/download/{filename}
2. Backend valida JWT → extrai user_id e role
3. Verifica permissão:
   - Admin: acesso a todos
   - Cliente: verifica se existe em document_shares
4. Se autorizado, gera signed URL do Storage (1h validade)
5. Retorna signed URL ou redireciona
```

---

## Fase 0: Preparação e Backup

Preparar ambiente e fazer backup dos dados existentes antes de iniciar a migração.

### Tarefas

- [ ] Fazer backup completo de `data/outputs/` (arquivos existentes)
- [ ] Listar todos os arquivos a serem migrados com metadados (nome, tamanho, data)
- [ ] Criar arquivo `.env.example` atualizado com todas as variáveis necessárias
- [ ] Documentar configuração atual do projeto

### Detalhes Técnicos

**Backup:**
```bash
# Criar backup dos arquivos existentes
tar -czvf backup_outputs_$(date +%Y%m%d).tar.gz data/outputs/

# Listar arquivos para migração
ls -la data/outputs/ > migration_file_list.txt
```

**Variáveis de ambiente necessárias (.env.example):**
```env
# Flask
PORT=8080
FLASK_ENV=production

# Supabase - Backend
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Apenas backend (nunca expor)
# JWT verificado via endpoint JWKS publico (ES256) - sem necessidade de secret

# Supabase - Frontend (prefixo VITE_)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...  # Chave pública
```

---

## Fase 1: Setup Supabase

Configurar projeto Supabase com banco de dados, Storage, tabelas e políticas de segurança.

### Tarefas

- [ ] Criar projeto no Supabase Dashboard [complexo]
  - [ ] Acessar https://supabase.com/dashboard
  - [ ] Criar novo projeto (anotar região - preferencialmente sa-east-1 para Brasil)
  - [ ] Aguardar provisionamento (~2 min)
  - [ ] Coletar credenciais (URL, anon key, service role key, JWT secret)
- [ ] Criar tabela `profiles` via SQL Editor
- [ ] Criar tabela `documents` via SQL Editor (com coluna `storage_path`)
- [ ] Criar tabela `document_shares` via SQL Editor
- [ ] Criar trigger para auto-criar profile
- [ ] Habilitar RLS em todas as tabelas
- [ ] Criar políticas RLS para `profiles`
- [ ] Criar políticas RLS para `documents`
- [ ] Criar políticas RLS para `document_shares`
- [ ] **Criar bucket `documents` no Storage** [novo]
- [ ] **Configurar políticas RLS do Storage** [novo]
- [ ] Criar usuário admin inicial manualmente

### Detalhes Técnicos

**Tabela profiles:**
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tabela documents:**
```sql
CREATE TABLE public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,              -- Nome original do arquivo (ex: relatorio_20260121.html)
  storage_path TEXT NOT NULL UNIQUE,   -- Caminho no Storage (ex: html/uuid-123.html)
  original_name TEXT,                  -- Nome do arquivo .md original (se upload)
  file_type TEXT NOT NULL CHECK (file_type IN ('html', 'pdf')),
  file_size BIGINT,                    -- Tamanho em bytes
  title TEXT,                          -- Título extraído do documento
  theme TEXT,                          -- Tema usado na conversão
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,  -- NULL para docs migrados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca
CREATE INDEX idx_documents_storage_path ON public.documents(storage_path);
CREATE INDEX idx_documents_created_by ON public.documents(created_by);
CREATE INDEX idx_documents_created_at ON public.documents(created_at DESC);
```

**Tabela document_shares:**
```sql
CREATE TABLE public.document_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  shared_with UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  shared_by UUID REFERENCES public.profiles(id) NOT NULL,
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, shared_with)
);

CREATE INDEX idx_shares_shared_with ON public.document_shares(shared_with);
```

**Trigger para auto-criar profile:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Habilitar RLS:**
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
```

**Políticas RLS - profiles:**
```sql
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

**Políticas RLS - documents:**
```sql
CREATE POLICY "Admins can do everything on documents" ON public.documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Clients can view shared documents" ON public.documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.document_shares
            WHERE document_id = documents.id AND shared_with = auth.uid())
  );
```

**Políticas RLS - document_shares:**
```sql
CREATE POLICY "Admins can manage shares" ON public.document_shares
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Clients can view own shares" ON public.document_shares
  FOR SELECT USING (shared_with = auth.uid());
```

**Criar admin inicial:**
1. No Supabase Dashboard > Authentication > Users > Add user
2. Criar usuário com email/senha
3. Executar SQL:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@seudominio.com';
```

---

## Fase 1.5: Setup Supabase Storage

Configurar bucket e políticas de acesso para armazenamento de arquivos.

### Tarefas

- [ ] Criar bucket `documents` no Storage Dashboard
- [ ] Configurar bucket como privado (não público)
- [ ] Criar política para admins fazerem upload
- [ ] Criar política para usuários visualizarem arquivos compartilhados
- [ ] Testar upload e download via Dashboard

### Detalhes Técnicos

**Criar bucket (via SQL ou Dashboard):**
```sql
-- Via SQL Editor (alternativa ao Dashboard)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,  -- Bucket PRIVADO
  52428800,  -- 50MB limite por arquivo
  ARRAY['text/html', 'application/pdf']::text[]
);
```

**Estrutura de pastas no bucket:**
```
documents/
├── html/
│   ├── {uuid-1}.html
│   └── {uuid-2}.html
└── pdf/
    ├── {uuid-1}.pdf
    └── {uuid-2}.pdf
```

**Políticas RLS do Storage:**

```sql
-- Política: Admins podem fazer upload
CREATE POLICY "Admins can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política: Admins podem deletar
CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política: Admins podem ver todos os arquivos
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política: Clientes podem ver arquivos compartilhados
CREATE POLICY "Clients can view shared documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1
    FROM public.documents d
    INNER JOIN public.document_shares ds ON ds.document_id = d.id
    WHERE d.storage_path = storage.objects.name
    AND ds.shared_with = auth.uid()
  )
);
```

**Testar via Dashboard:**
1. Storage > documents > Upload arquivo de teste
2. Tentar acessar URL pública (deve falhar - bucket privado)
3. Gerar signed URL e testar acesso

---

## Fase 2: Backend - Autenticação

Implementar validação de JWT do Supabase e decorators de proteção no Flask.

### Tarefas

- [ ] Adicionar dependências ao `requirements.txt`
- [ ] Adicionar configurações Supabase ao `config.py`
- [ ] Criar arquivo `utils/auth.py` [complexo]
  - [ ] Implementar `verify_supabase_token()`
  - [ ] Implementar `get_user_profile()`
  - [ ] Implementar decorator `@auth_required`
  - [ ] Implementar decorator `@admin_required`
- [ ] Criar arquivo `.env` com credenciais
- [ ] Testar autenticação com curl/Postman

### Detalhes Técnicos

**Adicionar ao requirements.txt:**
```
PyJWT[crypto]>=2.8.0
supabase>=2.0.0
```

> **Nota**: O extra `[crypto]` instala a biblioteca `cryptography`, necessária para suporte a algoritmos assimétricos como ES256 (ECDSA). Sem ele, apenas HS256 (HMAC) é suportado.

**Adicionar ao config.py:**
```python
import os

class Config:
    # ... configs existentes ...

    # Supabase
    SUPABASE_URL = os.environ.get('SUPABASE_URL')
    SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    # JWT verificado via JWKS/ES256 (endpoint publico) - SUPABASE_JWT_SECRET nao necessario
```

**Criar utils/auth.py:**
```python
import jwt
from jwt import PyJWKClient
from functools import wraps
from flask import request, jsonify, g
from config import Config
from utils.supabase_client import supabase_admin

# Cliente JWKS para buscar chaves publicas do Supabase (ES256)
# Cache de 600s (10 min) alinhado com cache do Supabase
JWKS_URL = f"{Config.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
jwks_client = PyJWKClient(JWKS_URL, cache_jwk_set=True, lifespan=600)

def verify_supabase_token(token):
    """Verifica e decodifica o JWT do Supabase usando JWKS/ES256"""
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated"
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_user_profile(user_id):
    """Busca o perfil do usuario no Supabase usando cliente admin"""
    try:
        response = supabase_admin.table('profiles').select('*').eq('id', user_id).single().execute()
        return response.data
    except Exception:
        return None

def auth_required(f):
    """Decorator que exige autenticacao em endpoints"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Token de autenticação ausente'}), 401

        token = auth_header.split(' ')[1]
        payload = verify_supabase_token(token)

        if not payload:
            return jsonify({'error': 'Token inválido ou expirado'}), 401

        user_id = payload.get('sub')
        profile = get_user_profile(user_id)

        if not profile:
            return jsonify({'error': 'Perfil de usuário não encontrado'}), 401

        g.user = profile
        g.user_id = user_id
        g.token = token  # Guardar token para uso com Storage
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    """Decorator que exige usuario admin"""
    @wraps(f)
    @auth_required
    def decorated(*args, **kwargs):
        if g.user.get('role') != 'admin':
            return jsonify({'error': 'Acesso restrito a administradores'}), 403
        return f(*args, **kwargs)
    return decorated
```

**Arquivo .env:**
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# JWT verificado via JWKS/ES256 (endpoint publico) - SUPABASE_JWT_SECRET nao necessario
```

**Testar autenticação:**
```bash
# 1. Obter token via Supabase
curl -X POST 'https://xxx.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"senha123"}'

# 2. Usar token no backend
curl http://localhost:5000/api/me \
  -H "Authorization: Bearer TOKEN_RETORNADO"
```

---

## Fase 3: Backend - Cliente Supabase e Endpoints

Criar cliente para interagir com Supabase e implementar novos endpoints.

### Tarefas

- [ ] Criar arquivo `utils/supabase_client.py` [complexo]
  - [ ] Implementar métodos para documents
  - [ ] Implementar métodos para shares
  - [ ] Implementar métodos para clients (admin)
- [ ] Adicionar endpoint `GET /api/me`
- [ ] Adicionar endpoint `GET /api/clients` (admin)
- [ ] Adicionar endpoint `POST /api/clients` (admin)
- [ ] Adicionar endpoint `DELETE /api/clients/<id>` (admin)
- [ ] Adicionar endpoint `GET /api/documents/<id>/shares` (admin)
- [ ] Adicionar endpoint `POST /api/documents/<id>/shares` (admin)
- [ ] Adicionar endpoint `DELETE /api/documents/<id>/shares/<client_id>` (admin)
- [ ] Modificar `GET /api/files` para filtrar por permissão
- [ ] Modificar `GET /api/download/<filename>` para verificar acesso
- [ ] Modificar `GET /api/preview/<filename>` para verificar acesso
- [ ] Modificar `DELETE /api/files/<filename>` para apenas admin
- [ ] Modificar conversão para registrar documento no banco

### Detalhes Técnicos

**Criar utils/supabase_client.py:**
```python
from supabase import create_client, Client
from config import Config
import uuid

# Cliente admin (usa service role key - apenas backend)
supabase_admin: Client = create_client(
    Config.SUPABASE_URL,
    Config.SUPABASE_SERVICE_ROLE_KEY
)

class SupabaseClient:
    """Cliente para operações no Supabase (DB + Storage)"""

    def __init__(self):
        self.client = supabase_admin
        self.bucket_name = 'documents'

    # ============ STORAGE ============

    def upload_file(self, content: bytes, file_type: str) -> str:
        """
        Faz upload de arquivo para o Storage.
        Retorna o storage_path (ex: 'html/uuid-123.html')
        """
        file_id = str(uuid.uuid4())
        folder = 'html' if file_type == 'html' else 'pdf'
        extension = 'html' if file_type == 'html' else 'pdf'
        storage_path = f"{folder}/{file_id}.{extension}"

        content_type = 'text/html' if file_type == 'html' else 'application/pdf'

        self.client.storage.from_(self.bucket_name).upload(
            path=storage_path,
            file=content,
            file_options={"content-type": content_type}
        )

        return storage_path

    def delete_file(self, storage_path: str) -> bool:
        """Deleta arquivo do Storage"""
        try:
            self.client.storage.from_(self.bucket_name).remove([storage_path])
            return True
        except Exception:
            return False

    def get_signed_url(self, storage_path: str, expires_in: int = 3600) -> str:
        """
        Gera URL assinada para download/preview.
        expires_in: tempo em segundos (padrão 1 hora)
        """
        response = self.client.storage.from_(self.bucket_name).create_signed_url(
            path=storage_path,
            expires_in=expires_in
        )
        return response.get('signedURL')

    # ============ DOCUMENTS ============

    def create_document(self, data: dict) -> dict:
        """Registra documento no banco de dados"""
        response = self.client.table('documents').insert(data).execute()
        return response.data[0] if response.data else None

    def get_documents_for_admin(self, page: int = 1, per_page: int = 10,
                                  search: str = '', file_type: str = '') -> tuple:
        """Lista todos os documentos (admin) com paginação e busca"""
        query = self.client.table('documents').select('*', count='exact')

        # Aplicar filtros
        if search:
            query = query.or_(f'filename.ilike.%{search}%,title.ilike.%{search}%')
        if file_type:
            query = query.eq('file_type', file_type)

        # Ordenar e paginar
        offset = (page - 1) * per_page
        response = query.order('created_at', desc=True).range(offset, offset + per_page - 1).execute()

        return response.data or [], response.count or 0

    def get_documents_for_client(self, user_id: str, page: int = 1, per_page: int = 10,
                                  search: str = '', file_type: str = '') -> tuple:
        """Lista documentos compartilhados com o cliente com paginação e busca"""
        # Primeiro, buscar IDs dos documentos compartilhados
        shares_response = self.client.table('document_shares').select(
            'document_id'
        ).eq('shared_with', user_id).execute()

        if not shares_response.data:
            return [], 0

        doc_ids = [s['document_id'] for s in shares_response.data]

        # Buscar documentos com filtros
        query = self.client.table('documents').select('*', count='exact').in_('id', doc_ids)

        if search:
            query = query.or_(f'filename.ilike.%{search}%,title.ilike.%{search}%')
        if file_type:
            query = query.eq('file_type', file_type)

        offset = (page - 1) * per_page
        response = query.order('created_at', desc=True).range(offset, offset + per_page - 1).execute()

        return response.data or [], response.count or 0

    def get_document_by_id(self, document_id: str) -> dict:
        """Busca documento por ID"""
        response = self.client.table('documents').select('*').eq('id', document_id).single().execute()
        return response.data

    def get_document_by_storage_path(self, storage_path: str) -> dict:
        """Busca documento pelo caminho no Storage"""
        response = self.client.table('documents').select('*').eq('storage_path', storage_path).single().execute()
        return response.data

    def delete_document(self, document_id: str) -> bool:
        """Deleta documento do banco e Storage"""
        doc = self.get_document_by_id(document_id)
        if doc:
            # Deletar do Storage
            self.delete_file(doc['storage_path'])
            # Deletar do banco
            self.client.table('documents').delete().eq('id', document_id).execute()
            return True
        return False

    # ============ SHARES ============

    def share_document(self, document_id: str, shared_with: str, shared_by: str) -> dict:
        """Compartilha documento com cliente"""
        data = {
            'document_id': document_id,
            'shared_with': shared_with,
            'shared_by': shared_by
        }
        response = self.client.table('document_shares').insert(data).execute()
        return response.data[0] if response.data else None

    def unshare_document(self, document_id: str, shared_with: str) -> bool:
        """Remove compartilhamento"""
        self.client.table('document_shares').delete().eq(
            'document_id', document_id
        ).eq('shared_with', shared_with).execute()
        return True

    def get_document_shares(self, document_id: str) -> list:
        """Lista com quem o documento está compartilhado"""
        response = self.client.table('document_shares').select(
            '*, profile:profiles!shared_with(id, email, full_name)'
        ).eq('document_id', document_id).execute()
        return response.data or []

    def check_user_has_access(self, document_id: str, user_id: str) -> bool:
        """Verifica se usuário tem acesso ao documento"""
        response = self.client.table('document_shares').select('id').eq(
            'document_id', document_id
        ).eq('shared_with', user_id).execute()
        return len(response.data) > 0 if response.data else False

    # ============ CLIENTS (Admin) ============

    def get_clients(self) -> list:
        """Lista todos os clientes"""
        response = self.client.table('profiles').select('*').eq(
            'role', 'client'
        ).order('created_at', desc=True).execute()
        return response.data or []

    def create_user(self, email: str, password: str, full_name: str) -> dict:
        """Cria novo usuário cliente"""
        response = self.client.auth.admin.create_user({
            'email': email,
            'password': password,
            'email_confirm': True,
            'user_metadata': {
                'full_name': full_name,
                'role': 'client'
            }
        })
        return response.user

    def delete_user(self, user_id: str) -> bool:
        """Deleta usuário"""
        try:
            self.client.auth.admin.delete_user(user_id)
            return True
        except Exception:
            return False

    def update_profile(self, user_id: str, data: dict) -> bool:
        """Atualiza perfil do usuário"""
        try:
            self.client.table('profiles').update(data).eq('id', user_id).execute()
            return True
        except Exception:
            return False

    def reset_user_password(self, user_id: str, new_password: str) -> bool:
        """Reseta senha do usuário"""
        try:
            self.client.auth.admin.update_user_by_id(
                user_id,
                {'password': new_password}
            )
            return True
        except Exception:
            return False

# Instância global
supabase = SupabaseClient()
```

**Novos endpoints em app.py:**
```python
from utils.auth import auth_required, admin_required
from utils.supabase_client import supabase
from flask import g

# Perfil do usuário atual
@app.route('/api/me', methods=['GET'])
@auth_required
def get_current_user():
    return jsonify({
        'success': True,
        'user': {
            'id': g.user_id,
            'email': g.user.get('email'),
            'full_name': g.user.get('full_name'),
            'role': g.user.get('role')
        }
    })

# CRUD Clientes (Admin)
@app.route('/api/clients', methods=['GET'])
@admin_required
def list_clients():
    clients = supabase.get_clients()
    return jsonify({'success': True, 'clients': clients})

@app.route('/api/clients', methods=['POST'])
@admin_required
def create_client():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name', '')

    if not email or not password:
        return jsonify({'error': 'Email e senha são obrigatórios'}), 400

    user = supabase.create_user(email, password, full_name)
    if user:
        return jsonify({'success': True, 'user': user}), 201
    return jsonify({'error': 'Erro ao criar usuário'}), 500

@app.route('/api/clients/<client_id>', methods=['DELETE'])
@admin_required
def delete_client(client_id):
    if supabase.delete_user(client_id):
        return jsonify({'success': True})
    return jsonify({'error': 'Erro ao remover cliente'}), 500

@app.route('/api/clients/<client_id>', methods=['PUT'])
@admin_required
def update_client(client_id):
    """Edita cliente: atualiza nome e/ou reseta senha"""
    data = request.get_json()
    full_name = data.get('full_name')
    reset_password = data.get('reset_password', False)

    result = {}

    # Atualiza nome no profiles
    if full_name:
        supabase.update_profile(client_id, {'full_name': full_name})
        result['full_name_updated'] = True

    # Reseta senha se solicitado
    if reset_password:
        import secrets
        new_password = secrets.token_urlsafe(12)
        supabase.reset_user_password(client_id, new_password)
        result['temp_password'] = new_password

    return jsonify({'success': True, **result})

# Compartilhamento (Admin)
@app.route('/api/documents/<document_id>/shares', methods=['GET'])
@admin_required
def get_shares(document_id):
    shares = supabase.get_document_shares(document_id)
    return jsonify({'success': True, 'shares': shares})

@app.route('/api/documents/<document_id>/shares', methods=['POST'])
@admin_required
def share_document(document_id):
    data = request.get_json()
    client_id = data.get('client_id')

    if not client_id:
        return jsonify({'error': 'client_id é obrigatório'}), 400

    share = supabase.share_document(document_id, client_id, g.user_id)
    if share:
        return jsonify({'success': True, 'share': share}), 201
    return jsonify({'error': 'Erro ao compartilhar documento'}), 500

@app.route('/api/documents/<document_id>/shares/<client_id>', methods=['DELETE'])
@admin_required
def unshare_document(document_id, client_id):
    if supabase.unshare_document(document_id, client_id):
        return jsonify({'success': True})
    return jsonify({'error': 'Erro ao remover compartilhamento'}), 500
```

**Modificar endpoint /api/files com paginação e busca:**
```python
@app.route('/api/files', methods=['GET'])
@auth_required
def list_files():
    role = g.user.get('role')
    user_id = g.user_id

    # Parâmetros de paginação e busca
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    file_type = request.args.get('type', '')  # html, pdf, ou vazio para todos

    if role == 'admin':
        documents, total = supabase.get_documents_for_admin(
            page=page, per_page=per_page, search=search, file_type=file_type
        )
    else:
        documents, total = supabase.get_documents_for_client(
            user_id, page=page, per_page=per_page, search=search, file_type=file_type
        )

    files = []
    for doc in documents:
        files.append({
            'id': doc.get('id'),
            'filename': doc.get('filename'),
            'title': doc.get('title'),
            'size': doc.get('file_size'),
            'type': doc.get('file_type'),
            'theme': doc.get('theme'),
            'created_at': doc.get('created_at'),
            'download_url': f'/api/download/{doc.get("id")}',
            'preview_url': f'/api/preview/{doc.get("id")}' if doc.get('file_type') == 'html' else None
        })

    total_pages = (total + per_page - 1) // per_page

    return jsonify({
        'success': True,
        'files': files,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages
    })
```

**Modificar endpoint /api/download (agora usa document_id):**
```python
@app.route('/api/download/<document_id>', methods=['GET'])
@auth_required
def download_file(document_id):
    role = g.user.get('role')
    user_id = g.user_id

    # Buscar documento
    doc = supabase.get_document_by_id(document_id)
    if not doc:
        return jsonify({'error': 'Documento não encontrado'}), 404

    # Verificar permissão
    if role != 'admin':
        if not supabase.check_user_has_access(document_id, user_id):
            return jsonify({'error': 'Acesso negado'}), 403

    # Gerar signed URL (1 hora de validade)
    signed_url = supabase.get_signed_url(doc['storage_path'], expires_in=3600)

    if not signed_url:
        return jsonify({'error': 'Erro ao gerar URL de download'}), 500

    # Opção 1: Redirecionar para signed URL
    return redirect(signed_url)

    # Opção 2: Retornar JSON com URL (frontend faz o download)
    # return jsonify({'success': True, 'url': signed_url, 'filename': doc['filename']})
```

**Modificar endpoint /api/preview (para HTML):**
```python
@app.route('/api/preview/<document_id>', methods=['GET'])
@auth_required
def preview_file(document_id):
    role = g.user.get('role')
    user_id = g.user_id

    doc = supabase.get_document_by_id(document_id)
    if not doc:
        return jsonify({'error': 'Documento não encontrado'}), 404

    if doc['file_type'] != 'html':
        return jsonify({'error': 'Preview disponível apenas para HTML'}), 400

    # Verificar permissão
    if role != 'admin':
        if not supabase.check_user_has_access(document_id, user_id):
            return jsonify({'error': 'Acesso negado'}), 403

    # Gerar signed URL para preview
    signed_url = supabase.get_signed_url(doc['storage_path'], expires_in=3600)

    return jsonify({'success': True, 'url': signed_url})
```

**Modificar conversão para usar Storage (ADMIN ONLY):**
```python
@app.route('/api/convert', methods=['POST'])
@admin_required  # APENAS ADMIN pode converter documentos
def convert_markdown():
    data = request.get_json()
    markdown_content = data.get('markdown', '')
    theme_name = data.get('theme', 'juridico')

    if not markdown_content:
        return jsonify({'error': 'Conteúdo markdown é obrigatório'}), 400

    # Converter markdown para HTML
    converter = MarkdownConverter()
    html_content = converter.convert(markdown_content)
    title = converter.extract_title(markdown_content)

    # Renderizar com template
    theme_config = theme_manager.get_theme_config(theme_name)
    rendered_html = render_template('base.html',
        content=html_content,
        theme=theme_config,
        title=title
    )

    # Upload para Supabase Storage
    html_bytes = rendered_html.encode('utf-8')
    storage_path = supabase.upload_file(html_bytes, 'html')

    # Gerar nome amigável para o arquivo
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'relatorio_{timestamp}.html'

    # Registrar no banco de dados
    document = supabase.create_document({
        'filename': filename,
        'storage_path': storage_path,
        'file_type': 'html',
        'file_size': len(html_bytes),
        'title': title,
        'theme': theme_name,
        'created_by': g.user_id
    })

    return jsonify({
        'success': True,
        'document_id': document['id'],
        'filename': filename,
        'title': title,
        'download_url': f'/api/download/{document["id"]}',
        'preview_url': f'/api/preview/{document["id"]}'
    })
```

**Endpoint DELETE /api/files (admin only):**
```python
@app.route('/api/files/<document_id>', methods=['DELETE'])
@admin_required
def delete_file(document_id):
    if supabase.delete_document(document_id):
        return jsonify({'success': True, 'message': 'Documento removido'})
    return jsonify({'error': 'Erro ao remover documento'}), 500
```

---

## Fase 4: Frontend - Infraestrutura de Auth

Configurar cliente Supabase, contexto de autenticação e API client.

### Tarefas

- [ ] Instalar dependências npm
- [ ] Criar arquivo `frontend/.env` com credenciais
- [ ] Criar `src/lib/supabase.js`
- [ ] Criar `src/lib/api.js` com interceptor JWT
- [ ] Criar `src/contexts/AuthContext.jsx` [complexo]
  - [ ] Implementar estado de autenticação
  - [ ] Implementar `signIn()` e `signOut()`
  - [ ] Implementar busca de perfil
  - [ ] Implementar `getAccessToken()`
- [ ] Atualizar `main.jsx` com AuthProvider

### Detalhes Técnicos

**Instalar dependências:**
```bash
cd frontend
npm install @supabase/supabase-js react-router-dom
```

**Criar frontend/.env:**
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Criar src/lib/supabase.js:**
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

**Criar src/lib/api.js:**
```javascript
import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  baseURL: '/api'
})

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

**Criar src/contexts/AuthContext.jsx:**
```javascript
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setProfile(data)
    }
    setLoading(false)
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    setProfile(null)
    return { error }
  }

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isClient: profile?.role === 'client',
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

**Atualizar main.jsx:**
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
```

---

## Fase 5: Frontend - Componentes de UI

Criar componentes de login, layout e dashboards para admin e cliente.

### Tarefas

- [ ] Criar `src/components/Login.jsx`
- [ ] Criar `src/components/Layout.jsx` (header com navegação e logout)
- [ ] Criar `src/components/ProtectedRoute.jsx`
- [ ] Criar `src/components/admin/AdminDashboard.jsx` [complexo]
  - [ ] Card: Total de Documentos
  - [ ] Card: Total de Clientes
  - [ ] Card: Documentos este mês
  - [ ] Lista: Últimos 5 documentos gerados
  - [ ] Atalhos: Novo Documento, Gerenciar Clientes, Ver Todos Docs
- [ ] Criar `src/components/admin/ClientManager.jsx` [complexo]
  - [ ] Listagem de clientes em tabela
  - [ ] Formulário de criação (nome, email, senha)
  - [ ] Botão de edição em cada linha → abre modal
  - [ ] Modal de edição com:
    - [ ] Campo: Nome completo
    - [ ] Botão: Resetar senha (mostra nova senha temporária)
    - [ ] Botões: Cancelar, Salvar
  - [ ] Botão de remoção com confirmação
- [ ] Criar `src/components/admin/ShareModal.jsx` [complexo]
  - [ ] Modal overlay
  - [ ] Título: "Compartilhar Documento"
  - [ ] Lista de clientes com checkbox
  - [ ] Checkbox "Selecionar todos"
  - [ ] Input de busca de clientes
  - [ ] Clientes já compartilhados aparecem marcados
  - [ ] Botões: Cancelar, Salvar
- [ ] Criar `src/components/client/ClientDashboard.jsx`
- [ ] Criar `src/components/client/MyDocuments.jsx`
- [ ] Reescrever `src/App.jsx` com rotas [complexo]
- [ ] Adaptar `src/components/FileManager.jsx` para usar API autenticada [complexo]
  - [ ] Usar api.js com interceptor JWT
  - [ ] Input de busca no topo
  - [ ] Filtro por tipo (dropdown: Todos, HTML, PDF)
  - [ ] Tabela com resultados
  - [ ] Botão "Compartilhar" para admin (abre ShareModal)
  - [ ] Paginação no rodapé: < 1 2 3 ... N >
  - [ ] Contador: "Mostrando 1-10 de 45 documentos"

### Detalhes Técnicos

**Criar src/components/Login.jsx:**
```javascript
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError('Email ou senha inválidos')
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

**Criar src/components/Layout.jsx:**
```javascript
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

export default function Layout({ children }) {
  const { profile, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <h1>Markdown Renderer</h1>
          <nav>
            <Link to="/">Dashboard</Link>
            <Link to="/documents">Documentos</Link>
            {isAdmin && <Link to="/clients">Clientes</Link>}
            {isAdmin && <Link to="/themes">Temas</Link>}
          </nav>
        </div>
        <div className="header-right">
          <span>{profile?.full_name || profile?.email}</span>
          <span className="role-badge">{isAdmin ? 'Admin' : 'Cliente'}</span>
          <button onClick={handleLogout}>Sair</button>
        </div>
      </header>
      <main className="app-main">
        {children}
      </main>
    </div>
  )
}
```

**Criar src/components/ProtectedRoute.jsx:**
```javascript
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth()

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}
```

**Reescrever src/App.jsx:**
```javascript
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import Layout from './components/Layout'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import AdminDashboard from './components/admin/AdminDashboard'
import ClientManager from './components/admin/ClientManager'
import ClientDashboard from './components/client/ClientDashboard'
import FileManager from './components/FileManager'
import ThemeManager from './components/ThemeManager'
import './App.css'

function Dashboard() {
  const { isAdmin } = useAuth()
  return isAdmin ? <AdminDashboard /> : <ClientDashboard />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/documents" element={
        <ProtectedRoute>
          <Layout>
            <FileManager />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/clients" element={
        <AdminRoute>
          <Layout>
            <ClientManager />
          </Layout>
        </AdminRoute>
      } />

      <Route path="/themes" element={
        <AdminRoute>
          <Layout>
            <ThemeManager />
          </Layout>
        </AdminRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
```

**Criar src/components/admin/ClientManager.jsx:**
```javascript
import { useState, useEffect } from 'react'
import api from '../../lib/api'

export default function ClientManager() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '' })

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      const response = await api.get('/clients')
      setClients(response.data.clients)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateClient(e) {
    e.preventDefault()
    try {
      await api.post('/clients', formData)
      setFormData({ email: '', password: '', full_name: '' })
      setShowForm(false)
      loadClients()
    } catch (error) {
      alert('Erro ao criar cliente')
    }
  }

  async function handleDeleteClient(clientId) {
    if (!confirm('Tem certeza que deseja remover este cliente?')) return
    try {
      await api.delete(`/clients/${clientId}`)
      loadClients()
    } catch (error) {
      alert('Erro ao remover cliente')
    }
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div className="client-manager">
      <div className="header">
        <h2>Gerenciar Clientes</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Novo Cliente'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateClient} className="client-form">
          <input
            type="text"
            placeholder="Nome completo"
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <button type="submit">Criar Cliente</button>
        </form>
      )}

      <table className="clients-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Criado em</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(client => (
            <tr key={client.id}>
              <td>{client.full_name || '-'}</td>
              <td>{client.email}</td>
              <td>{new Date(client.created_at).toLocaleDateString('pt-BR')}</td>
              <td>
                <button onClick={() => handleDeleteClient(client.id)}>Remover</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

**Criar src/components/admin/AdminDashboard.jsx:**
```javascript
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalDocs: 0,
    totalClients: 0,
    docsThisMonth: 0
  })
  const [recentDocs, setRecentDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const [filesRes, clientsRes] = await Promise.all([
        api.get('/files?per_page=5'),
        api.get('/clients')
      ])

      const docs = filesRes.data.files
      const clients = clientsRes.data.clients

      // Calcular docs deste mês
      const now = new Date()
      const thisMonth = docs.filter(d => {
        const created = new Date(d.created_at)
        return created.getMonth() === now.getMonth() &&
               created.getFullYear() === now.getFullYear()
      })

      setStats({
        totalDocs: filesRes.data.total,
        totalClients: clients.length,
        docsThisMonth: thisMonth.length
      })
      setRecentDocs(docs)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div className="admin-dashboard">
      <h2>Dashboard</h2>

      <div className="stats-cards">
        <div className="stat-card">
          <h3>{stats.totalDocs}</h3>
          <p>Total de Documentos</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalClients}</h3>
          <p>Total de Clientes</p>
        </div>
        <div className="stat-card">
          <h3>{stats.docsThisMonth}</h3>
          <p>Documentos este Mês</p>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Ações Rápidas</h3>
        <Link to="/convert" className="action-btn">Novo Documento</Link>
        <Link to="/clients" className="action-btn">Gerenciar Clientes</Link>
        <Link to="/documents" className="action-btn">Ver Todos Documentos</Link>
      </div>

      <div className="recent-docs">
        <h3>Últimos Documentos</h3>
        <ul>
          {recentDocs.map(doc => (
            <li key={doc.id}>
              <span>{doc.title || doc.filename}</span>
              <span>{new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

**Criar src/components/admin/ShareModal.jsx:**
```javascript
import { useState, useEffect } from 'react'
import api from '../../lib/api'

export default function ShareModal({ documentId, onClose, onSave }) {
  const [clients, setClients] = useState([])
  const [selectedClients, setSelectedClients] = useState(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [documentId])

  async function loadData() {
    try {
      const [clientsRes, sharesRes] = await Promise.all([
        api.get('/clients'),
        api.get(`/documents/${documentId}/shares`)
      ])

      setClients(clientsRes.data.clients)

      // Marcar clientes já compartilhados
      const sharedIds = sharesRes.data.shares.map(s => s.shared_with)
      setSelectedClients(new Set(sharedIds))
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  function toggleClient(clientId) {
    const newSelected = new Set(selectedClients)
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId)
    } else {
      newSelected.add(clientId)
    }
    setSelectedClients(newSelected)
  }

  function toggleAll() {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set())
    } else {
      setSelectedClients(new Set(filteredClients.map(c => c.id)))
    }
  }

  async function handleSave() {
    try {
      // Pegar shares atuais para comparar
      const sharesRes = await api.get(`/documents/${documentId}/shares`)
      const currentShares = new Set(sharesRes.data.shares.map(s => s.shared_with))

      // Adicionar novos
      for (const clientId of selectedClients) {
        if (!currentShares.has(clientId)) {
          await api.post(`/documents/${documentId}/shares`, { client_id: clientId })
        }
      }

      // Remover desmarcados
      for (const clientId of currentShares) {
        if (!selectedClients.has(clientId)) {
          await api.delete(`/documents/${documentId}/shares/${clientId}`)
        }
      }

      onSave()
    } catch (error) {
      alert('Erro ao salvar compartilhamentos')
    }
  }

  const filteredClients = clients.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="modal-overlay"><div className="modal">Carregando...</div></div>

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Compartilhar Documento</h3>

        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <label className="select-all">
          <input
            type="checkbox"
            checked={selectedClients.size === filteredClients.length && filteredClients.length > 0}
            onChange={toggleAll}
          />
          Selecionar todos
        </label>

        <div className="clients-list">
          {filteredClients.map(client => (
            <label key={client.id} className="client-item">
              <input
                type="checkbox"
                checked={selectedClients.has(client.id)}
                onChange={() => toggleClient(client.id)}
              />
              <span>{client.full_name || client.email}</span>
              <span className="email">{client.email}</span>
            </label>
          ))}
        </div>

        <div className="modal-actions">
          <button onClick={onClose}>Cancelar</button>
          <button onClick={handleSave} className="primary">Salvar</button>
        </div>
      </div>
    </div>
  )
}
```

**Atualizar src/components/admin/ClientManager.jsx com edição:**
```javascript
import { useState, useEffect } from 'react'
import api from '../../lib/api'

export default function ClientManager() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '' })
  const [editingClient, setEditingClient] = useState(null)
  const [editData, setEditData] = useState({ full_name: '' })
  const [tempPassword, setTempPassword] = useState(null)

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      const response = await api.get('/clients')
      setClients(response.data.clients)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateClient(e) {
    e.preventDefault()
    try {
      await api.post('/clients', formData)
      setFormData({ email: '', password: '', full_name: '' })
      setShowForm(false)
      loadClients()
    } catch (error) {
      alert('Erro ao criar cliente')
    }
  }

  async function handleDeleteClient(clientId) {
    if (!confirm('Tem certeza que deseja remover este cliente?')) return
    try {
      await api.delete(`/clients/${clientId}`)
      loadClients()
    } catch (error) {
      alert('Erro ao remover cliente')
    }
  }

  function openEditModal(client) {
    setEditingClient(client)
    setEditData({ full_name: client.full_name || '' })
    setTempPassword(null)
  }

  async function handleUpdateClient() {
    try {
      await api.put(`/clients/${editingClient.id}`, editData)
      setEditingClient(null)
      loadClients()
    } catch (error) {
      alert('Erro ao atualizar cliente')
    }
  }

  async function handleResetPassword() {
    try {
      const response = await api.put(`/clients/${editingClient.id}`, {
        reset_password: true
      })
      setTempPassword(response.data.temp_password)
    } catch (error) {
      alert('Erro ao resetar senha')
    }
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div className="client-manager">
      <div className="header">
        <h2>Gerenciar Clientes</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Novo Cliente'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateClient} className="client-form">
          <input
            type="text"
            placeholder="Nome completo"
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <button type="submit">Criar Cliente</button>
        </form>
      )}

      <table className="clients-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Criado em</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(client => (
            <tr key={client.id}>
              <td>{client.full_name || '-'}</td>
              <td>{client.email}</td>
              <td>{new Date(client.created_at).toLocaleDateString('pt-BR')}</td>
              <td>
                <button onClick={() => openEditModal(client)}>Editar</button>
                <button onClick={() => handleDeleteClient(client.id)}>Remover</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal de Edição */}
      {editingClient && (
        <div className="modal-overlay" onClick={() => setEditingClient(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Editar Cliente</h3>
            <p>{editingClient.email}</p>

            <div className="form-group">
              <label>Nome completo</label>
              <input
                type="text"
                value={editData.full_name}
                onChange={e => setEditData({...editData, full_name: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Senha</label>
              <button type="button" onClick={handleResetPassword}>
                Resetar Senha
              </button>
              {tempPassword && (
                <div className="temp-password">
                  Nova senha temporária: <code>{tempPassword}</code>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={() => setEditingClient(null)}>Cancelar</button>
              <button onClick={handleUpdateClient} className="primary">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Adaptar FileManager.jsx com paginação e busca:**
```javascript
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import ShareModal from './admin/ShareModal'

export default function FileManager() {
  const { isAdmin } = useAuth()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [fileType, setFileType] = useState('')
  const [shareDocId, setShareDocId] = useState(null)

  const perPage = 10

  useEffect(() => {
    loadFiles()
  }, [page, search, fileType])

  async function loadFiles() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString()
      })
      if (search) params.append('search', search)
      if (fileType) params.append('type', fileType)

      const response = await api.get(`/files?${params}`)
      setFiles(response.data.files)
      setTotal(response.data.total)
      setTotalPages(response.data.total_pages)
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    loadFiles()
  }

  const startItem = (page - 1) * perPage + 1
  const endItem = Math.min(page * perPage, total)

  return (
    <div className="file-manager">
      <h2>Documentos</h2>

      <div className="filters">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Buscar por nome ou título..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit">Buscar</button>
        </form>

        <select value={fileType} onChange={e => { setFileType(e.target.value); setPage(1) }}>
          <option value="">Todos os tipos</option>
          <option value="html">HTML</option>
          <option value="pdf">PDF</option>
        </select>
      </div>

      {loading ? (
        <div>Carregando...</div>
      ) : (
        <>
          <table className="files-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Tipo</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr key={file.id}>
                  <td>{file.title || file.filename}</td>
                  <td>{file.type.toUpperCase()}</td>
                  <td>{new Date(file.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <a href={file.download_url}>Download</a>
                    {file.preview_url && <a href={file.preview_url}>Preview</a>}
                    {isAdmin && (
                      <>
                        <button onClick={() => setShareDocId(file.id)}>Compartilhar</button>
                        <button onClick={() => handleDelete(file.id)}>Excluir</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <span>Mostrando {startItem}-{endItem} de {total} documentos</span>
            <div className="pagination-controls">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>&lt;</button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  className={page === i + 1 ? 'active' : ''}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>&gt;</button>
            </div>
          </div>
        </>
      )}

      {shareDocId && (
        <ShareModal
          documentId={shareDocId}
          onClose={() => setShareDocId(null)}
          onSave={() => { setShareDocId(null); loadFiles() }}
        />
      )}
    </div>
  )
}
```

---

## Fase 6: Integração Final

Testar fluxos completos e ajustar detalhes.

### Tarefas

- [ ] Testar login como admin
- [ ] Testar criação de cliente
- [ ] Testar conversão de documento (deve registrar no banco)
- [ ] Testar compartilhamento de documento
- [ ] Testar login como cliente
- [ ] Testar visualização de documento compartilhado
- [ ] Testar download de documento compartilhado
- [ ] Testar que cliente não vê documentos não compartilhados
- [ ] Testar remoção de compartilhamento
- [ ] Ajustar estilos CSS conforme necessário
- [ ] Atualizar Docker para incluir variáveis de ambiente

### Detalhes Técnicos

**Atualizar docker-compose.yml (desenvolvimento local):**
```yaml
services:
  axion-viewer:
    build: .
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      # JWT verificado via JWKS/ES256 (endpoint publico) - SUPABASE_JWT_SECRET nao necessario
    volumes:
      - ./data:/app/data
```

**Atualizar Dockerfile para frontend:**
```dockerfile
# No estágio de build do frontend, passar variáveis como ARG
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN pnpm run build
```

**Atualizar GitHub Actions workflow (`.github/workflows/`):**
```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
    build-args: |
      VITE_SUPABASE_URL=${{ secrets.VITE_SUPABASE_URL }}
      VITE_SUPABASE_ANON_KEY=${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

**Configurar variáveis na Railway:**
- No dashboard Railway > Settings > Variables:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - JWT verificado via JWKS/ES256 (endpoint publico) — `SUPABASE_JWT_SECRET` **não é necessário**
- Variáveis `VITE_*` são injetadas via GitHub Actions (build time)

---

## Fase 7: Migração de Arquivos Existentes

Migrar arquivos de `data/outputs/` para Supabase Storage e registrar no banco.

### Tarefas

- [ ] Criar script de migração `scripts/migrate_files.py`
- [ ] Testar migração com poucos arquivos
- [ ] Executar migração completa
- [ ] Verificar integridade dos arquivos migrados
- [ ] Remover arquivos locais após confirmação (opcional)

### Detalhes Técnicos

**Criar scripts/migrate_files.py:**
```python
#!/usr/bin/env python3
"""
Script de migração de arquivos existentes para Supabase Storage.
Arquivos migrados ficam sem owner (created_by = NULL) e visíveis apenas para admin.
"""
import os
import sys
from datetime import datetime

# Adicionar diretório pai ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import Config
from utils.supabase_client import supabase

def get_file_title(filepath):
    """Tenta extrair título do arquivo HTML"""
    if filepath.endswith('.html'):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                # Buscar <title> ou <h1>
                import re
                title_match = re.search(r'<title>([^<]+)</title>', content)
                if title_match:
                    return title_match.group(1)
                h1_match = re.search(r'<h1[^>]*>([^<]+)</h1>', content)
                if h1_match:
                    return h1_match.group(1)
        except Exception:
            pass
    return None

def migrate_files():
    """Migra todos os arquivos de data/outputs/ para Supabase Storage"""
    output_folder = Config.OUTPUT_FOLDER

    if not os.path.exists(output_folder):
        print(f"Pasta {output_folder} não existe. Nada a migrar.")
        return

    files = os.listdir(output_folder)
    total = len(files)
    migrated = 0
    errors = 0

    print(f"Encontrados {total} arquivos para migrar.")
    print("-" * 50)

    for filename in files:
        filepath = os.path.join(output_folder, filename)

        if not os.path.isfile(filepath):
            continue

        # Determinar tipo
        if filename.endswith('.html'):
            file_type = 'html'
        elif filename.endswith('.pdf'):
            file_type = 'pdf'
        else:
            print(f"[SKIP] {filename} - tipo não suportado")
            continue

        try:
            # Ler arquivo
            with open(filepath, 'rb') as f:
                content = f.read()

            # Upload para Storage
            storage_path = supabase.upload_file(content, file_type)

            # Extrair metadados
            stat = os.stat(filepath)
            title = get_file_title(filepath)

            # Registrar no banco
            document = supabase.create_document({
                'filename': filename,
                'storage_path': storage_path,
                'file_type': file_type,
                'file_size': stat.st_size,
                'title': title or f'Documento migrado: {filename}',
                'theme': None,  # Desconhecido
                'created_by': None  # Sem owner (arquivo legado)
            })

            migrated += 1
            print(f"[OK] {filename} -> {storage_path}")

        except Exception as e:
            errors += 1
            print(f"[ERRO] {filename}: {str(e)}")

    print("-" * 50)
    print(f"Migração concluída: {migrated}/{total} arquivos migrados, {errors} erros")

    if migrated > 0 and errors == 0:
        print("\nTodos os arquivos migrados com sucesso!")
        print("Você pode remover a pasta data/outputs/ se desejar.")

if __name__ == '__main__':
    print("=== Migração de Arquivos para Supabase Storage ===")
    print()

    confirm = input("Deseja iniciar a migração? (s/n): ")
    if confirm.lower() == 's':
        migrate_files()
    else:
        print("Migração cancelada.")
```

**Executar migração:**
```bash
# Ativar ambiente virtual (se usar)
source venv/bin/activate

# Configurar variáveis de ambiente
export SUPABASE_URL=https://xxxxx.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Executar script
python scripts/migrate_files.py
```

**Verificar migração:**
```sql
-- No SQL Editor do Supabase
SELECT
  filename,
  storage_path,
  file_type,
  file_size,
  created_by,
  created_at
FROM documents
WHERE created_by IS NULL  -- Arquivos migrados (sem owner)
ORDER BY created_at DESC;
```

---

## Checklist de Verificação Final

### Autenticação
- [ ] Login com email/senha funciona
- [ ] Sessão persiste entre recarregamentos
- [ ] Logout limpa sessão corretamente
- [ ] Token JWT é enviado em todas as requisições
- [ ] Endpoints protegidos retornam 401 sem token
- [ ] Endpoints admin retornam 403 para clientes

### Área Admin
- [ ] Admin pode criar novos clientes
- [ ] Admin pode listar todos os clientes
- [ ] Admin pode remover clientes
- [ ] Admin visualiza TODOS os documentos (incluindo migrados)
- [ ] Admin pode compartilhar documento com cliente
- [ ] Admin pode remover compartilhamento
- [ ] Admin pode gerenciar temas (criar, editar, deletar)
- [ ] Tema "juridico" continua protegido contra deleção

### Área Cliente
- [ ] Cliente vê apenas documentos compartilhados
- [ ] Cliente pode fazer download via signed URL
- [ ] Cliente pode visualizar preview de HTML
- [ ] Cliente NÃO pode deletar documentos
- [ ] Cliente NÃO pode ver documentos de outros clientes
- [ ] Cliente NÃO pode acessar área de temas

### Conversão de Documentos
- [ ] Conversão exige autenticação
- [ ] Documento é salvo no Supabase Storage
- [ ] Registro é criado na tabela documents
- [ ] `created_by` é preenchido com user_id
- [ ] Signed URL funciona para download

### Storage
- [ ] Bucket `documents` está privado
- [ ] Upload funciona para admin
- [ ] Download via signed URL funciona
- [ ] Políticas RLS estão ativas
- [ ] Arquivos PDF e HTML são aceitos

### Migração
- [ ] Script de migração executa sem erros
- [ ] Arquivos existentes aparecem no painel admin
- [ ] Arquivos migrados têm `created_by = NULL`
- [ ] Títulos são extraídos corretamente dos HTML

### Deploy
- [ ] Docker build passa com variáveis Supabase
- [ ] docker-compose.yml tem todas variáveis
- [ ] GitHub Actions tem secrets configurados
- [ ] Deploy em produção funciona

---

## Resumo das Fases

| Fase | Descrição | Dependências |
|------|-----------|--------------|
| **0** | Preparação e Backup | - |
| **1** | Setup Supabase (tabelas, RLS) | 0 |
| **1.5** | Setup Storage (bucket, policies) | 1 |
| **2** | Backend - Autenticação | 1 |
| **3** | Backend - Cliente Supabase + Endpoints | 1.5, 2 |
| **4** | Frontend - Infraestrutura Auth | 1 |
| **5** | Frontend - Componentes UI | 4 |
| **6** | Integração e Testes | 3, 5 |
| **7** | Migração de Arquivos | 6 |

---

## Arquivos Criados/Modificados

### Novos Arquivos
```
utils/auth.py                              # Decorators de autenticação
utils/supabase_client.py                   # Cliente Supabase (DB + Storage)
scripts/migrate_files.py                   # Script de migração
frontend/src/lib/supabase.js               # Cliente Supabase JS
frontend/src/lib/api.js                    # Axios com interceptor JWT
frontend/src/contexts/AuthContext.jsx      # Contexto de auth
frontend/src/components/Login.jsx          # Página de login
frontend/src/components/Layout.jsx         # Layout com nav/logout
frontend/src/components/ProtectedRoute.jsx # Proteção de rotas
frontend/src/components/admin/AdminDashboard.jsx
frontend/src/components/admin/ClientManager.jsx
frontend/src/components/admin/ShareModal.jsx
frontend/src/components/client/ClientDashboard.jsx
```

### Arquivos Modificados
```
requirements.txt                           # +PyJWT, +supabase
config.py                                  # +Configurações Supabase
app.py                                     # +Decorators, +Endpoints, +Storage
frontend/package.json                      # +@supabase/supabase-js, +react-router-dom
frontend/src/main.jsx                      # +BrowserRouter, +AuthProvider
frontend/src/App.jsx                       # Migrar tabs → Routes
frontend/src/components/FileManager.jsx    # +API autenticada, +Signed URLs
Dockerfile                                 # +ARGs Vite
docker-compose.yml                         # +Variáveis Supabase
.env.example                               # +Todas variáveis
```
