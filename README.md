# Axion Viewer

Plataforma completa para gestao de documentos juridicos com conversao Markdown para HTML/PDF, area administrativa e portal do cliente. Backend Flask + Frontend React + Supabase (auth, storage, database).

## Funcionalidades

- **Conversao MD para HTML/PDF** com templates profissionais e temas customizaveis
- **Area Administrativa** com gestao de clientes, carteiras, casos, processos e documentos
- **Portal do Cliente** com acesso restrito por carteira (read-only)
- **Autenticacao Supabase** com JWT verificado via JWKS/ES256
- **Storage Supabase** para upload e gerenciamento de arquivos gerados
- **Tabelas complexas** com celulas vazias, alinhamento e formatacao avancada
- **Extracao automatica de metadados** (processo, partes, vara, data)
- **Multiplos temas** (juridico, litigation, corporativo) + criacao de temas customizados

## Desenvolvimento Local

### Pre-requisitos

- Python 3.11+
- [UV](https://docs.astral.sh/uv/) (gerenciador de pacotes Python)
- Node.js 18+ com pnpm
- Variaveis de ambiente Supabase (ver `.env.example`)

### Backend

```bash
uv sync --extra dev
uv run python app.py           # porta 5000
```

### Frontend

```bash
cd frontend
pnpm install
pnpm dev                       # porta 5173, proxy /api/* -> backend
```

### Verificacao rapida

```bash
# Backend: lint + format + testes
uv run ruff check . && uv run ruff format . && uv run pytest tests/ -v

# Frontend: lint + format + testes
cd frontend && pnpm lint && pnpm format:check && pnpm test --run
```

## Deploy

Producao na **Railway** via CI/CD automatico.

```
git push origin main → GitHub Actions (build Docker) → Railway (deploy)
```

- **Docker Hub**: [marcosmarf27/axion-viewer](https://hub.docker.com/r/marcosmarf27/axion-viewer)
- **Guias**: [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) | [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md) | [QUICK_START_DOCKER.md](QUICK_START_DOCKER.md)

## Arquitetura

```
app.py                          # Flask app factory + blueprint registration
config.py                       # Configuracoes (pastas, limites, extensoes)
pyproject.toml                  # UV/Ruff/pytest config
routes/
├── __init__.py                 # Registro de todos os blueprints
├── auth_routes.py              # POST /api/auth/verify
├── convert_routes.py           # POST /api/convert, /api/convert/pdf, etc.
├── files_routes.py             # GET /api/files, download, preview, delete
├── themes_routes.py            # CRUD /api/themes
├── clientes_routes.py          # CRUD /api/clientes
├── carteiras_routes.py         # CRUD /api/carteiras
├── casos_routes.py             # CRUD /api/casos
├── processos_routes.py         # CRUD /api/processos
├── documentos_routes.py        # CRUD /api/documentos
├── sharing_routes.py           # Gestao de acesso por carteira
└── dashboard_routes.py         # GET /api/dashboard (admin e cliente)
utils/
├── auth.py                     # JWT JWKS/ES256 + decorators auth_required/admin_required
├── supabase_client.py          # SupabaseService (Storage, DB, Auth Admin)
├── markdown_converter.py       # MD→HTML com BeautifulSoup
├── theme_manager.py            # Temas (JSON configs)
└── pdf_converter.py            # HTML→PDF com WeasyPrint
templates/
├── base.html                   # Template Jinja2 base
└── themes/                     # juridico/, litigation/, corporativo/
tests/
├── conftest.py                 # Fixtures pytest
├── test_converter.py           # Testes unitarios
└── test_api_integration.py     # Testes de integracao
frontend/                       # React SPA (Vite + Tailwind v4 + shadcn/ui)
├── src/
│   ├── contexts/AuthContext.jsx    # Provider auth Supabase
│   ├── hooks/useAuth.js            # Hook de autenticacao
│   ├── lib/
│   │   ├── api.js                  # Axios + JWT interceptor
│   │   ├── supabase.js             # Cliente Supabase
│   │   └── utils.js                # Helper cn()
│   ├── pages/
│   │   ├── LoginPage.jsx           # Tela de login
│   │   ├── DashboardRedirect.jsx   # Redireciona admin vs client
│   │   ├── admin/                  # 11 paginas admin (CRUD completo)
│   │   └── client/                 # 5 paginas cliente (read-only)
│   └── components/
│       ├── Layout.jsx              # Sidebar + nav dinamica por role
│       ├── ProtectedRoute.jsx      # Guards de autenticacao
│       └── ui/                     # Componentes shadcn/ui
└── vite.config.js
```

## Endpoints Principais

### Conversao (autenticado)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/convert` | Markdown JSON → HTML |
| POST | `/api/convert/file` | Upload .md → HTML |
| POST | `/api/convert/pdf` | Markdown JSON → PDF |
| POST | `/api/convert/file/pdf` | Upload .md → PDF |

### Gestao (admin)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| CRUD | `/api/clientes` | Gestao de clientes |
| CRUD | `/api/carteiras` | Gestao de carteiras |
| CRUD | `/api/casos` | Gestao de casos |
| CRUD | `/api/processos` | Gestao de processos |
| CRUD | `/api/documentos` | Gestao de documentos |
| CRUD | `/api/themes` | Gestao de temas |
| GET/POST/DELETE | `/api/sharing/*` | Controle de acesso por carteira |
| GET/POST/DELETE | `/api/accounts` | Gestao de contas (Auth Admin) |

### Dashboard e Arquivos
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/dashboard` | Dados do dashboard (admin ou cliente) |
| GET | `/api/files` | Lista arquivos gerados |
| GET | `/api/files/<id>/download` | Download de arquivo |
| POST | `/api/auth/verify` | Verificacao de token JWT |

## Tecnologias

### Backend
- **Flask 3.0** + Blueprints
- **UV** (gerenciamento de deps)
- **Supabase** (Auth + Storage + PostgreSQL)
- **WeasyPrint** (geracao de PDF)
- **Ruff** (lint + format)
- **pytest** (testes)

### Frontend
- **React** + Vite
- **Tailwind CSS v4** + shadcn/ui
- **Supabase JS** (auth client-side)
- **pnpm** (gerenciamento de deps)
- **Vitest** + Testing Library (testes)

## Licenca

Projeto privado.
