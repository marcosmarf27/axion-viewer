# Axion Viewer

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visao Geral

**Axion Viewer** — Plataforma completa para gestao de documentos juridicos: conversao MD→HTML/PDF, area administrativa (CRUD clientes/carteiras/casos/processos/documentos) e portal do cliente (read-only). Backend Flask com Blueprints + Frontend React + Supabase (Auth, Storage, PostgreSQL).

**Repositorio**: https://github.com/marcosmarf27/axion-viewer
**Docker Hub**: https://hub.docker.com/r/marcosmarf27/axion-viewer

## Consulta de Documentacao

**OBRIGATORIO**: Sempre que precisar consultar documentacao de bibliotecas, frameworks ou APIs:

### Ferramentas MCP
- **Ref**: `ref_search_documentation` para buscar docs, `ref_read_url` para ler conteudo
- **Exa**: `get_code_context_exa` para exemplos de codigo atualizados

**Fluxo recomendado**: ref_search -> get_code_context -> ref_read_url

## Comandos de Desenvolvimento

### Backend (Flask API com UV)

```bash
# Instalar UV (se nao tiver)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Sincronizar dependencias (inclui dev)
uv sync --extra dev

# Executar API
uv run python app.py

# Executar em porta especifica
FLASK_PORT=8000 uv run python app.py

# Producao com Gunicorn
uv run gunicorn --bind=0.0.0.0:5000 --reuse-port app:app
```

### Linting e Formatacao (Ruff)

```bash
# Verificar codigo
uv run ruff check .

# Corrigir automaticamente
uv run ruff check . --fix

# Formatar codigo
uv run ruff format .
```

### Testes Backend (pytest)

```bash
# Executar testes
uv run pytest tests/ -v

# Com cobertura
uv run pytest tests/ --cov=. --cov-report=html

# Teste especifico
uv run pytest tests/test_converter.py -v
```

### Frontend (React + Vite + Tailwind CSS v4 + shadcn/ui)

```bash
cd frontend

# Instalar dependencias
pnpm install

# Desenvolvimento
pnpm dev

# Build para producao
pnpm build

# Lint (ESLint)
pnpm lint

# Formatacao (Prettier)
pnpm format

# Testes (Vitest)
pnpm test

# Testes com UI
pnpm test:ui

# Testes com cobertura
pnpm test:coverage

# Adicionar componentes shadcn/ui
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add --all  # todos os componentes
```

### Docker

```bash
# Testar localmente
./test-local.sh

# Build e push para Docker Hub
./build-and-push.sh 1.0.0

# Docker Compose (desenvolvimento)
docker-compose up
```

## Deploy (Railway)

A aplicacao esta em producao na **Railway**.

| Item | Valor |
|------|-------|
| Plataforma | Railway |
| Volume | `/app/data` (50GB) |
| Arquivos | `/app/data/outputs/` |

### Fluxo de Deploy (CI/CD)

```
git push → GitHub Actions (build Docker image) → Railway (deploy)
```

1. `git push` para o repositorio
2. GitHub Actions builda a imagem Docker (injeta variaveis `VITE_*` como build args)
3. Railway detecta nova imagem e faz deploy automatico

### Variaveis de Ambiente

**GitHub Actions Secrets** (Settings > Secrets > Actions) — ja configurados:
- `DOCKERHUB_USERNAME` = `marcosmarf27`
- `DOCKERHUB_TOKEN` = token Docker Hub
- `VITE_SUPABASE_URL` = `https://rvzkszfowlzioddqjryz.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `sb_publishable_By8P6igMjQYhOj18G37J_A_Ao7dQsFv`

**Railway Variables** (Dashboard > Settings > Variables):
- `PORT` = `8080`
- `SUPABASE_URL` = `https://rvzkszfowlzioddqjryz.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_aLHe6WDEWoczDo0Ah2Ksrg_rckvR5n8`
- JWT verificado via endpoint JWKS publico (ES256) - sem necessidade de secret

### Railway CLI

```bash
# Instalar CLI
npm install -g @railway/cli

# Login
railway login

# Executar comando no container de producao
railway run python scripts/migrate_files.py

# Ver logs
railway logs
```

## Arquitetura

```
pyproject.toml                  # Configuracao UV/Ruff/pytest
app.py                          # Flask app factory + CORS + blueprint registration + static
config.py                       # Configuracoes (pastas, limites, extensoes)
├── routes/                     # Blueprints Flask (cada dominio separado)
│   ├── __init__.py             # register_blueprints() — registra todos
│   ├── auth_routes.py          # POST /api/auth/verify
│   ├── convert_routes.py       # POST /api/convert, /convert/file, /convert/pdf, etc.
│   ├── files_routes.py         # GET /api/files, download, preview, generate-pdf, delete
│   ├── themes_routes.py        # CRUD /api/themes
│   ├── clientes_routes.py      # CRUD /api/clientes
│   ├── carteiras_routes.py     # CRUD /api/carteiras
│   ├── casos_routes.py         # CRUD /api/casos
│   ├── processos_routes.py     # CRUD /api/processos
│   ├── documentos_routes.py    # CRUD /api/documentos
│   ├── sharing_routes.py       # Gestao de acesso por carteira
│   └── dashboard_routes.py     # GET /api/dashboard (admin e cliente)
├── utils/
│   ├── auth.py                 # verify_supabase_token (JWKS/ES256), decorators auth_required/admin_required
│   ├── supabase_client.py      # SupabaseService: Storage, DB CRUD generico, Auth Admin
│   ├── markdown_converter.py   # Conversao MD→HTML com BeautifulSoup
│   ├── theme_manager.py        # Gerenciamento de temas (JSON configs)
│   └── pdf_converter.py        # Conversao HTML→PDF com WeasyPrint
├── templates/
│   ├── base.html               # Template Jinja2 base para relatorios
│   └── themes/                 # juridico/, litigation/, corporativo/
├── tests/
│   ├── conftest.py             # Fixtures pytest
│   ├── test_converter.py       # Testes unitarios MarkdownConverter
│   └── test_api_integration.py # Testes integracao API
└── frontend/                   # React SPA (Vite + Tailwind v4 + shadcn/ui)
    ├── vite.config.js          # Vite + Tailwind plugin + alias @/ + proxy /api
    ├── components.json         # Configuracao shadcn/ui
    └── src/
        ├── contexts/AuthContext.jsx   # Provider auth Supabase (signIn, profile, isAdmin)
        ├── hooks/useAuth.js           # Hook de autenticacao
        ├── lib/
        │   ├── api.js                 # Axios + JWT interceptor automatico
        │   ├── supabase.js            # Cliente Supabase (frontend)
        │   └── utils.js               # Helper cn() para Tailwind
        ├── pages/
        │   ├── LoginPage.jsx          # Tela de login
        │   ├── DashboardRedirect.jsx  # Redireciona admin vs client por role
        │   ├── admin/                 # 11 paginas: Dashboard, Clientes, Carteiras, Casos,
        │   │                          #   Processos, ProcessoDetail, Documentos, Convert,
        │   │                          #   Themes, Accounts, Sharing
        │   └── client/               # 5 paginas read-only: Dashboard, Carteiras, Casos,
        │                              #   Processos, ProcessoDetail
        └── components/
            ├── Layout.jsx             # Sidebar + nav dinamica por role
            ├── ProtectedRoute.jsx     # Guards: AdminRoute / ProtectedRoute
            ├── ConfirmDialog.jsx      # Dialog de confirmacao reutilizavel
            ├── EmptyState.jsx         # Estado vazio
            ├── Pagination.jsx         # Paginacao de tabelas
            ├── LoadingSpinner.jsx     # Indicador de carregamento
            └── ui/                    # Componentes shadcn/ui (Tailwind)
```

## Fluxo de Conversao

1. **Pre-processamento**: `MarkdownConverter._preprocess_markdown()` limpa referencias, processa `<details>` e prepara tabelas
2. **Conversao**: Usa biblioteca `markdown` com extensoes (tables, fenced_code, nl2br, etc.)
3. **Pos-processamento**: BeautifulSoup para limpeza de celulas vazias, formatacao de referencias documentais
4. **Renderizacao**: Template Jinja2 (`base.html`) com configuracao do tema
5. **PDF (opcional)**: WeasyPrint converte HTML final
6. **Storage**: Upload do arquivo gerado para Supabase Storage (bucket `documents`)
7. **Registro**: Insere metadata no banco (tabela `documentos`) vinculado ao usuario

## Endpoints Principais

### Autenticacao e Auth
- `POST /api/auth/verify` - Verifica token JWT

### Conversao (auth_required)
- `POST /api/convert` - Markdown JSON → HTML
- `POST /api/convert/file` - Upload .md → HTML
- `POST /api/convert/pdf` - Markdown JSON → PDF
- `POST /api/convert/file/pdf` - Upload .md → PDF

### Arquivos (auth_required)
- `GET /api/files` - Lista arquivos gerados
- `GET /api/files/<id>/download` - Download de arquivo
- `GET /api/files/<id>/preview` - Preview inline
- `POST /api/files/<id>/generate-pdf` - Gera PDF de HTML existente
- `DELETE /api/files/<id>` - Remove arquivo

### Temas (admin_required para escrita)
- `GET /api/themes` - Lista temas
- `POST /api/themes` - Cria tema
- `PUT /api/themes/<name>` - Atualiza tema
- `DELETE /api/themes/<name>` - Remove tema

### CRUD Admin (admin_required)
- `CRUD /api/clientes` - Gestao de clientes
- `CRUD /api/carteiras` - Gestao de carteiras
- `CRUD /api/casos` - Gestao de casos
- `CRUD /api/processos` - Gestao de processos
- `CRUD /api/documentos` - Gestao de documentos
- `GET/POST/DELETE /api/accounts` - Gestao de contas (Supabase Auth Admin)
- `GET/POST/DELETE /api/sharing/*` - Controle de acesso por carteira

### Dashboard
- `GET /api/dashboard` - Dados do dashboard (admin: totais gerais, cliente: dados das suas carteiras)

## Sistema de Autenticacao

### Backend (JWKS/ES256)
- JWT verificado via endpoint publico JWKS do Supabase (`/auth/v1/.well-known/jwks.json`)
- Algoritmo ES256 (assimetrico) — nao precisa de JWT secret
- `utils/auth.py`: `verify_supabase_token()` valida e decodifica o token
- Decorators: `@auth_required` (qualquer usuario logado), `@admin_required` (role admin)
- Dados do usuario ficam em `g.user` (profile), `g.user_id`, `g.token`

### Frontend (Supabase JS)
- `AuthContext.jsx`: provider com `signIn()`, `signOut()`, `user`, `profile`, `isAdmin`
- `api.js`: interceptor Axios injeta `Authorization: Bearer <token>` automaticamente
- `ProtectedRoute.jsx`: componente wrapper que redireciona para login se nao autenticado
- `DashboardRedirect.jsx`: redireciona `/dashboard` para admin ou client baseado no role

### Fluxo de Login
1. Usuario faz login via `supabase.auth.signInWithPassword()`
2. Supabase retorna JWT + session
3. `AuthContext` busca profile do banco (`public.profiles`)
4. Rotas protegidas verificam JWT no backend via JWKS
5. `g.user.role` determina permissoes (admin vs client)

### Banco de Dados (Supabase PostgreSQL)
- `auth.users` — tabela nativa Supabase Auth
- `public.profiles` — estende auth.users com `full_name`, `role` (enum: admin/client)
- Trigger `on_auth_user_created` cria profile automaticamente
- RLS ativado em todas as tabelas publicas
- Tabelas de dominio: `clientes`, `carteiras`, `casos`, `processos`, `documentos`
- Tabela de acesso: `cliente_carteira_access` (vincula profile a carteira)

## Padroes de Codigo

### Python
- **Gerenciamento de deps**: UV com `pyproject.toml`
- **Formatacao**: Ruff (line-length: 88)
- **Linting**: Ruff (E, F, I, UP, B, SIM)
- **Testes**: pytest com fixtures em `conftest.py`
- **Imports**: Ordenados automaticamente pelo Ruff (isort)

### React/JavaScript
- **Gerenciamento de deps**: pnpm
- **Formatacao**: Prettier (single quotes, semi)
- **Linting**: ESLint com plugins React
- **Testes**: Vitest + Testing Library
- **Componentes**: Functional components com hooks
- **Estilizacao**: Tailwind CSS v4 + shadcn/ui (novos componentes)
- **CSS legado**: Componentes existentes usam CSS puro (sem migracao)
- **Alias**: `@/` aponta para `src/` (imports limpos)

## Padroes Importantes

- **Blueprints**: Cada dominio tem seu proprio blueprint em `routes/` registrado via `register_blueprints()`
- **CRUD generico**: `SupabaseService._list()`, `_get()`, `_create()`, `_update()`, `_delete()` em `supabase_client.py`
- **Paginacao**: Todos os endpoints de listagem suportam `?page=1&per_page=20&sort=created_at&order=desc&search=`
- **Sort seguro**: Whitelist `ALLOWED_SORT_FIELDS` em `supabase_client.py` evita SQL injection via sort
- **Auth decorators**: `@auth_required` seta `g.user`, `g.user_id`, `g.token`; `@admin_required` exige role admin
- **Nomes de temas**: lowercase, validados com `os.path.basename()` para seguranca
- **Arquivos de saida**: Upload para Supabase Storage (bucket `documents`), registro em tabela `documentos`
- **Temas customizados**: Persistidos em `data/themes/` (volume Docker)
- **Metadados**: Extraidos automaticamente do markdown (processo, partes, vara, data)
- **Referencias documentais**: Convertidas para `<span class="reference-span">(Seq.: X, Y)</span>`
- **Frontend roles**: Paginas admin em `pages/admin/`, paginas client em `pages/client/`
- **Sidebar dinamica**: `Layout.jsx` renderiza navegacao diferente para admin vs client

## Variaveis de Ambiente

### Backend (runtime)
- `FLASK_PORT` - Porta do servidor (padrao: 5000)
- `DATA_FOLDER` - Pasta para dados persistentes (padrao: `data/`)
- `SUPABASE_URL` = `https://rvzkszfowlzioddqjryz.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_aLHe6WDEWoczDo0Ah2Ksrg_rckvR5n8`
- JWT verificado via endpoint JWKS publico (ES256) - sem necessidade de secret

### Frontend (build time - prefixo VITE_)
- `VITE_SUPABASE_URL` = `https://rvzkszfowlzioddqjryz.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `sb_publishable_By8P6igMjQYhOj18G37J_A_Ao7dQsFv`

## Verificacao Rapida

```bash
# Backend: lint + format + testes
uv run ruff check . && uv run ruff format . && uv run pytest tests/ -v

# Frontend: lint + format + testes
cd frontend && pnpm lint && pnpm format:check && pnpm test --run
```

## Supabase

O projeto usa MCP Supabase conectado via plugin do Claude Code para consultas, migracoes e debugging.

| Item | Valor |
|------|-------|
| **Projeto** | `axion-viewer` |
| **Project ID** | `rvzkszfowlzioddqjryz` |
| **Regiao** | `sa-east-1` (Sao Paulo) |
| **URL** | `https://rvzkszfowlzioddqjryz.supabase.co` |
| **DB Host** | `db.rvzkszfowlzioddqjryz.supabase.co` |
| **Publishable Key** (frontend) | `sb_publishable_By8P6igMjQYhOj18G37J_A_Ao7dQsFv` |
| **Secret Key** (backend) | `sb_secret_aLHe6WDEWoczDo0Ah2Ksrg_rckvR5n8` |
| **Legacy Anon Key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2emtzemZvd2x6aW9kZHFqcnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MTUzMjQsImV4cCI6MjA4NTA5MTMyNH0.QY0xN1XCLtfzE6O-E2_7GHbNXRGkdv2tmfnoXAW6ot8` |

> **Nota**: Repositorio privado. Chaves formato novo (`sb_publishable_`, `sb_secret_`) recomendadas pelo Supabase.

## Especificacoes de Features

Especificacoes detalhadas de novas features ficam em `specs/`. Cada spec segue a estrutura:
- `requirements.md` — Requisitos e criterios de aceitacao
- `implementation-plan.md` — Plano de implementacao detalhado
- `action-required.md` — Acoes manuais necessarias

### Specs existentes
- `specs/area-cliente-supabase/` — Area do Cliente com Autenticacao Supabase (implementado)
- `specs/animacao-login-matrix/` — Animacao Matrix na tela de login
