# Requisitos: Area do Cliente Completa com Modelo Hierarquico

## Descricao

Implementar sistema completo de area do cliente no Axion Viewer com modelo de dados hierarquico (Cliente > Carteira > Caso > Processo > Documento), autenticacao via Supabase Auth, armazenamento de documentos no Supabase Storage, painel administrativo com dashboard/CRUD e painel do cliente com navegacao drill-down e filtros avancados.

O sistema substitui o armazenamento local em filesystem (`data/outputs/`) por Supabase Storage, adiciona autenticacao JWT e controle de acesso por roles (admin/cliente), e preserva 100% do pipeline de conversao Markdown→HTML→PDF existente.

**Substitui**: `specs/area-cliente-supabase/` (modelo simplificado sem hierarquia)

## Contexto e Motivacao

Hoje a API gera relatorios HTML/PDF de analises juridicas e salva no filesystem local. Nao existe autenticacao, controle de acesso, nem area para clientes visualizarem seus documentos. O admin precisa de um painel para cadastrar clientes, carteiras, casos e processos, associar documentos e gerenciar acessos. Clientes precisam de login e visualizacao dos seus dados.

## Modelo de Dados

Hierarquia completa do PRD (`docs/especificacao_painel_cliente_axioma_v2.md`):

```
Cliente (entidade de negocio)
  └── Carteira (agrupamento comercial)
       └── Caso (unidade analitica)
            └── Processo (processo judicial CNJ)
                 ├── Documento (HTML/PDF gerado)
                 └── Processo Incidental (self-referencing: embargos, recursos, agravos)
```

### Entidades

**Cliente**: nome, email, telefone, documento (CPF/CNPJ, UNIQUE), tipo (PF/PJ), status (ativo/inativo), created_at, updated_at

**Carteira**: nome, descricao, cliente_id, data_aquisicao, valor_total, qtd_casos, qtd_processos, status (ativa/encerrada/em_analise)

**Caso**: nome, descricao, carteira_id, tese, credor_principal, devedor_principal, cnpj_cpf_devedor, valor_total, recuperabilidade, uf_principal, observacoes, status (em_andamento/concluido/arquivado)

**Processo**: numero_cnj, caso_id, processo_pai_id (self-ref nullable), tipo_tese (NPL/RJ/Divida_Ativa/Litigio), tipo_acao, is_incidental, recuperabilidade (Alta/Potencial/Critica/Indefinida/Nenhuma), valor_causa, valor_divida, valor_atualizado, polo_ativo, polo_passivo, comarca, vara, tribunal, uf, fase_processual, data_distribuicao, ultima_movimentacao, data_ultima_movimentacao, data_analise, observacoes, status (ativo/suspenso/arquivado/encerrado)

**Documento**: processo_id (nullable), filename, original_name, file_type (html/pdf/md), storage_path, file_size, title, theme, created_by, created_at, updated_at

**Profile** (auth): id (ref auth.users), email, full_name, role (admin/client)

**Cliente-Carteira Access**: profile_id, carteira_id, granted_by, granted_at

## Restricoes Tecnicas e Decisoes de Design

### Dockerfile: Migrar para UV

O Dockerfile atual usa `pip install -r requirements.txt`. Como o projeto usa UV com `pyproject.toml` para gerenciamento de dependencias, o Dockerfile DEVE ser migrado para UV. Isso garante que as novas dependencias (`supabase`, `PyJWT[crypto]`) sejam instaladas corretamente em producao sem necessidade de manter `requirements.txt` sincronizado manualmente.

### Storage: Cleanup e Atomicidade

- **Upload + INSERT atomico**: Se o INSERT no banco falhar apos o upload no Storage, deve haver try/catch que deleta o arquivo do Storage (evitar orfaos)
- **DELETE CASCADE e Storage**: Deletar um `cliente` cascateia ate `documentos` no PostgreSQL, mas arquivos no Storage NAO sao deletados automaticamente. Solucao: trigger PostgreSQL `BEFORE DELETE ON documentos` que registra paths a limpar, ou logica no backend que deleta do Storage antes de deletar do banco
- **Soft delete**: NAO implementar soft delete nesta versao. Usar hard delete com cleanup explicito

### Busca Textual: ILIKE (MVP)

Para a versao inicial, usar `ILIKE` para buscas textuais (numero CNJ, partes, comarca). Full-text search com `to_tsvector/to_tsquery` fica como melhoria futura se a performance degradar com volume alto.

### Paginacao Backend

Todos os endpoints de listagem DEVEM suportar parametros de paginacao:
- `page` (default: 1)
- `per_page` (default: 20, max: 100)
- `sort_field` (default: `created_at`)
- `sort_order` (default: `desc`)
- `search` (opcional, busca ILIKE em campos relevantes)

Response paginado:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### Frontend: Destino dos Componentes Existentes

Os componentes existentes (`MarkdownEditor.jsx`, `FileManager.jsx`, `ThemeManager.jsx`, `FileUpload.jsx`, `ApiDocs.jsx`, `ThemeSelector.jsx`) serao **reutilizados como base** para as novas paginas admin:
- `MarkdownEditor.jsx` → logica copiada para `ConvertPage.jsx` (com campo processo_id/title adicionais)
- `ThemeManager.jsx` → logica copiada para `ThemesPage.jsx` (com auth decorator)
- `FileManager.jsx` → substituido por `DocumentosPage.jsx` (nova interface com filtros)
- `FileUpload.jsx` → incorporado em `ConvertPage.jsx`
- `ApiDocs.jsx` → removido (substituido por dashboard)
- `ThemeSelector.jsx` → reutilizado como componente compartilhado

Os arquivos originais serao MANTIDOS no repositorio ate que todas as paginas novas estejam funcionais, e entao removidos em commit separado.

### Frontend: Responsividade Mobile

Layout com sidebar usa toggle/drawer para mobile:
- Sidebar colapsavel com hamburger menu em telas < 768px
- Tabelas responsivas com scroll horizontal em telas pequenas
- Cards em grid responsivo (1 coluna mobile, 2 tablet, 3+ desktop)

### Testes Frontend

Testes minimos obrigatorios para as novas paginas:
- Teste de renderizacao basica de cada pagina (monta sem erros)
- Teste do AuthContext (login, logout, state)
- Teste do ProtectedRoute (redirect para login)
- Testes podem ser adicionados incrementalmente apos MVP funcional

## Decisoes Arquiteturais

### Preservacao do Motor de Conversao

Arquivos INTOCAVEIS (zero modificacoes):
- `utils/markdown_converter.py` - Pipeline MD→HTML
- `utils/pdf_converter.py` - HTML→PDF via WeasyPrint
- `utils/theme_manager.py` - Gerenciamento de temas filesystem
- `templates/base.html` - Template Jinja2
- `templates/themes/juridico/config.json` - Tema padrao

### Temas: 100% Filesystem

Temas sao configuracao de renderizacao, NAO documentos de cliente. ThemeManager continua operando no filesystem local (`templates/themes/` + `data/themes/`). Nenhuma tabela Supabase para temas.

### Storage: Filesystem → Supabase

Documentos gerados migram de `data/outputs/` para Supabase Storage (bucket `documents` privado). O pipeline de conversao nao muda - so o destino dos bytes.

### Autenticacao

- Supabase Auth com email/senha
- JWT verificado via JWKS publico (ES256) - sem necessidade de secret JWT
- 2 niveis: Admin (acesso total) e Cliente (somente carteiras com acesso)
- Admin cria contas de clientes manualmente (sem auto-cadastro)

### Compartilhamento

- Por carteira: admin associa profile (conta de usuario) a carteira
- Cliente ve automaticamente todos os casos, processos e documentos da carteira
- Documentos sem processo (`processo_id IS NULL`) visiveis apenas para admins

### Fluxo do Admin

1. Admin converte documento (MD→HTML/PDF) - documento fica sem vinculo (processo_id = NULL)
2. Admin cadastra Cliente > Carteira > Caso > Processo via formularios
3. Admin associa documento ao processo
4. Admin associa conta de usuario (profile) a carteira para dar acesso ao cliente

### Endpoints de Conversao

Campos adicionais OPCIONAIS no request (nao quebram API existente):
- `processo_id` (opcional) - vincula documento ao processo na hora da conversao
- `title` (opcional) - titulo customizado

Response preserva formato original + campos novos (`document_id`, `signed_url`).

## Criterios de Aceitacao

### Autenticacao e Autorizacao
- [ ] Login com email/senha via Supabase Auth
- [ ] JWT verificado via JWKS (ES256) em cada request protegido
- [ ] Decorator `@auth_required` para endpoints autenticados
- [ ] Decorator `@admin_required` para endpoints admin-only
- [ ] Sessao persiste no frontend (refresh token) com opcoes `autoRefreshToken: true, persistSession: true` no Supabase client
- [ ] Logout limpa sessao
- [ ] Rotas protegidas redirecionam para /login
- [ ] AuthContext busca profile via Supabase JS client direto (tabela `profiles` com RLS) em vez de depender do backend Flask

### Area Admin - Dashboard
- [ ] Dashboard com cards de estatisticas (total clientes, carteiras, processos, documentos, docs este mes)
- [ ] Grafico de distribuicao por tipo de tese (NPL, RJ, Divida Ativa, Litigio)
- [ ] Grafico de distribuicao por recuperabilidade
- [ ] Lista de atividade recente (ultimos 10 documentos)
- [ ] Acoes rapidas (converter documento, novo cliente, novo processo)

### Area Admin - CRUD
- [ ] CRUD completo de Clientes (entidade de negocio)
- [ ] CRUD completo de Carteiras (vinculadas a cliente)
- [ ] CRUD completo de Casos (vinculados a carteira, com tese e recuperabilidade)
- [ ] CRUD completo de Processos (vinculados a caso, com todos os campos do PRD)
- [ ] Suporte a processos incidentais (self-referencing via processo_pai_id)
- [ ] Gerenciamento de documentos (listar, vincular a processo, excluir)
- [ ] Documentos sem processo (`processo_id IS NULL`) listados separadamente para admin vincular

### Area Admin - Contas e Compartilhamento
- [ ] Criar conta de usuario (email/senha) via Supabase Auth Admin API
- [ ] Listar contas de usuario
- [ ] Resetar senha de usuario
- [ ] Excluir conta de usuario
- [ ] Associar profile a carteira (conceder acesso)
- [ ] Revogar acesso de profile a carteira
- [ ] Listar acessos por carteira

### Area Admin - Conversao e Temas
- [ ] Conversao MD→HTML funciona identicamente ao sistema atual
- [ ] Conversao MD→PDF funciona identicamente ao sistema atual
- [ ] Conversao via upload de arquivo funciona identicamente
- [ ] Documentos convertidos sao salvos no Supabase Storage (nao mais filesystem)
- [ ] Registro criado na tabela `documentos` apos conversao
- [ ] Campo `processo_id` opcional na conversao
- [ ] Temas continuam operando no filesystem (ThemeManager intocavel)
- [ ] CRUD de temas funciona identicamente com `@admin_required`

### Area Cliente - Dashboard
- [ ] Dashboard com cards resumo (carteiras com acesso, total casos, total processos)
- [ ] Lista de carteiras com cards visuais (nome, qtd_casos, qtd_processos, valor_total)
- [ ] Navegacao drill-down: carteira → casos → processos → documentos

### Area Cliente - Navegacao e Filtros
- [ ] Lista de carteiras com acesso
- [ ] Lista de casos dentro de carteira
- [ ] Lista de processos dentro de caso
- [ ] Detalhe do processo com documentos e processos incidentais
- [ ] Filtros completos do PRD:
  - [ ] Busca textual (numero CNJ, partes, comarca)
  - [ ] Filtro por tipo de tese
  - [ ] Filtro por recuperabilidade
  - [ ] Filtro por faixa de valor
  - [ ] Filtro por comarca/jurisdicao
  - [ ] Filtro por periodo (data distribuicao)
  - [ ] Ordenacao por multiplos campos
- [ ] Download de documentos via signed URL (1h validade)
- [ ] Preview de HTML via signed URL
- [ ] Paginacao (20 itens por pagina)

### Supabase Storage
- [ ] Bucket `documents` privado criado
- [ ] RLS policies para admins (upload/delete/view all)
- [ ] RLS policies para clientes (view documentos em carteiras com acesso)
- [ ] Signed URLs com 1h de validade
- [ ] Mime types restritos (text/html, application/pdf, text/markdown)
- [ ] Cleanup de Storage em caso de falha no INSERT do banco (try/catch no backend)
- [ ] Cleanup de Storage antes de DELETE CASCADE (trigger ou logica backend)

### Migracao
- [ ] Script migra todos os arquivos de `data/outputs/` para Supabase Storage
- [ ] Hierarquia placeholder criada (cliente/carteira/caso/processo "Migrados")
- [ ] Registros criados na tabela `documentos`
- [ ] Arquivos locais preservados como backup

### Backend - Refatoracao
- [ ] `app.py` refatorado com factory pattern `create_app()`
- [ ] 11 Flask Blueprints em `routes/`
- [ ] Logica de conversao COPIADA (nao reescrita) do app.py para blueprint
- [ ] Logica de temas COPIADA (nao reescrita) do app.py para blueprint
- [ ] Todos os testes existentes passam apos refatoracao

### Frontend - Refatoracao
- [ ] React Router com rotas protegidas (/login, /admin/*, /client/*)
- [ ] AuthContext com estado de autenticacao
- [ ] Layout com sidebar, header e breadcrumb
- [ ] Axios com JWT interceptor automatico

### RLS Policies
- [ ] Todas as tabelas com RLS habilitado
- [ ] Admins tem acesso total a todas as tabelas
- [ ] Clientes veem apenas dados em carteiras com acesso (via `cliente_carteira_access`)
- [ ] Documentos sem processo visiveis apenas para admins
- [ ] Storage policies alinhadas com database policies
- [ ] SQL detalhado para TODAS as policies (profiles, clientes, carteiras, casos, processos, documentos, cliente_carteira_access)
- [ ] Indices nos campos usados em JOINs das RLS policies (caso_id, carteira_id, processo_id, profile_id)

### Indices de Banco de Dados
- [ ] Indices em TODAS as foreign keys usadas em JOINs de RLS policies
- [ ] Indices em campos filtráveis (tipo_tese, recuperabilidade, uf, status, data_distribuicao)
- [ ] Indice UNIQUE em `clientes.documento` (CPF/CNPJ)
- [ ] Indice em `cliente_carteira_access(profile_id, carteira_id)` para performance de RLS

## Dependencias

### Backend
- `supabase>=2.0.0` - Cliente Python Supabase
- `PyJWT[crypto]>=2.8.0` - Verificacao JWT com suporte ES256

### Frontend
- `@supabase/supabase-js` - Cliente JS Supabase
- `react-router-dom@6` - Roteamento

### Infraestrutura
- Supabase Project `rvzkszfowlzioddqjryz` (sa-east-1) - ja existe
- Supabase Auth, Database (PostgreSQL), Storage
- Railway com volume `/app/data` para temas e uploads temporarios

## Faseamento Recomendado (3 Ciclos)

O escopo total (~45-50 arquivos novos/modificados, 35+ endpoints, 10 migrations) e ambicioso. Recomenda-se implementar em 3 ciclos:

### Ciclo 1 — Infra + Auth + Blueprints
- Schema do banco (migrations com indices e RLS completas)
- Migracao Dockerfile para UV
- Refatoracao app.py para blueprints + factory pattern
- Auth JWT (decorators, middleware)
- Endpoints de conversao com Supabase Storage
- Todos os testes existentes passando
- **Entrega: API funcional autenticada**

### Ciclo 2 — Admin CRUD + Dashboard
- CRUD clientes, carteiras, casos, processos, documentos
- Dashboard admin com stats e graficos
- Gerenciamento de contas e compartilhamento
- **Entrega: Painel admin funcional**

### Ciclo 3 — Frontend Completo + Area Cliente
- Frontend auth + React Router + Layout
- Paginas admin
- Paginas client com drill-down e filtros
- Migracao de arquivos
- **Entrega: Sistema completo**

## Riscos e Mitigacao

| Risco | Impacto | Mitigacao |
|-------|---------|-----------|
| Refatoracao app.py para blueprints | Regressao nos testes existentes | Executar testes apos cada mudanca; manter app.py original em branch separada |
| RLS policies com JOIN chains de 3 niveis | Performance lenta e corretude dificil | Indices explicitos; testes de performance com dados de exemplo |
| Reescrita total do frontend | Quebra de funcionalidades existentes | Manter componentes originais ate novas paginas estarem prontas |
| Migracao de Storage | Irreversivel em producao | Backup obrigatorio antes; script de migracao NAO deleta locais |
| Dockerfile migrando para UV | Build de producao falhar | Testar docker build localmente antes de push |

## Features Relacionadas

- `specs/area-cliente-supabase/` - Versao anterior com modelo simplificado (SUBSTITUIDA por esta spec)
- `specs/migracao-axion-viewer/` - Migracao do repositorio (ja concluida)
- `docs/especificacao_painel_cliente_axioma_v2.md` - PRD original com modelo de dados completo
