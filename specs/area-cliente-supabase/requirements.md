# Requisitos: Área do Cliente com Autenticação Supabase

## Descrição

Implementar sistema de autenticação e autorização usando Supabase Auth, criando duas áreas distintas:

1. **Área Administrativa**: O admin pode gerenciar clientes, visualizar todos os documentos gerados e compartilhar documentos específicos com clientes selecionados.

2. **Área do Cliente**: Clientes fazem login com email/senha e visualizam apenas os documentos que foram explicitamente compartilhados com eles pelo administrador.

Esta feature resolve a necessidade de controle de acesso aos relatórios gerados, permitindo que documentos jurídicos sejam compartilhados de forma segura com clientes específicos.

## Decisões de Arquitetura

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| **Quem converte documentos** | Apenas Admin | Endpoints de conversão são restritos a admin. Clientes apenas visualizam documentos compartilhados. |
| **Interface de compartilhamento** | Modal com checkboxes | Modal exibe lista de clientes com checkboxes para seleção múltipla. |
| **Admin Dashboard** | Estatísticas + atalhos | Cards com métricas, lista de últimos docs, atalhos rápidos. |
| **Cliente Dashboard** | Lista direta de docs | Clientes veem diretamente seus documentos compartilhados. |
| **Notificações** | Não no MVP | Feature descartada para primeira versão. |
| **Paginação** | 10 documentos por página | Padrão para listagem de documentos. |
| **Migração de arquivos existentes** | Migrar para o banco | Script migrará arquivos de `data/outputs/` para Supabase Storage + registro no banco. |
| **Storage de arquivos** | Supabase Storage | Arquivos HTML/PDF serão armazenados no Supabase Storage em vez de disco local. |

## Critérios de Aceitação

### Autenticação
- [ ] Usuários podem fazer login com email/senha via Supabase Auth
- [ ] Sessão persiste entre recarregamentos da página
- [ ] Logout funciona corretamente e limpa a sessão
- [ ] Rotas protegidas redirecionam para login se não autenticado

### Área Admin
- [ ] Admin pode criar novos clientes (email, senha, nome)
- [ ] Admin pode listar todos os clientes cadastrados
- [ ] Admin pode editar nome do cliente
- [ ] Admin pode resetar senha do cliente (gera nova senha temporária)
- [ ] Admin pode remover clientes
- [ ] Admin visualiza TODOS os documentos gerados
- [ ] Admin pode compartilhar documento específico com cliente(s) via modal com checkboxes
- [ ] Admin pode remover compartilhamento
- [ ] Admin Dashboard exibe estatísticas (total docs, total clientes, docs este mês)
- [ ] Admin Dashboard exibe últimos 5 documentos gerados
- [ ] Admin Dashboard exibe atalhos rápidos (Novo Documento, Gerenciar Clientes, Ver Todos Docs) de documento

### Área Cliente
- [ ] Cliente vê apenas documentos compartilhados com ele
- [ ] Cliente pode fazer download de documentos compartilhados
- [ ] Cliente pode visualizar preview de documentos HTML compartilhados
- [ ] Cliente NÃO pode deletar documentos
- [ ] Cliente NÃO pode ver documentos de outros clientes

### Backend
- [ ] **TODOS** os endpoints exigem autenticação JWT (exceto `/api/health`)
- [ ] Endpoints de conversão (`/api/convert/*`) são restritos a **admin apenas**
- [ ] Clientes NÃO podem converter documentos (retorna 403 Forbidden)
- [ ] Endpoints de clientes e compartilhamento são restritos a admin
- [ ] Documentos convertidos são registrados no banco de dados
- [ ] Download/preview verificam permissão antes de gerar signed URL
- [ ] Endpoints de temas (`/api/themes/*`) são restritos a admin

### Paginação
- [ ] GET /api/files retorna com paginação (10 itens por página)
- [ ] Query params: `?page=1&per_page=10&search=termo&type=html`
- [ ] Resposta inclui: `{ files: [], total: N, page: 1, per_page: 10, total_pages: N }`

### Busca e Filtro
- [ ] Busca por nome do documento (filename)
- [ ] Busca por título (title)
- [ ] Filtro por tipo (html/pdf ou todos)
- [ ] Filtro por data (created_at)

### Edição de Cliente
- [ ] Endpoint PUT /api/clients/<id> para edição
- [ ] Admin pode editar nome completo (full_name)
- [ ] Admin pode resetar senha (gera nova senha temporária e retorna)

### Supabase Storage
- [ ] Bucket `documents` criado com acesso privado
- [ ] Arquivos HTML/PDF são salvos no Storage (não mais em disco local)
- [ ] Políticas RLS configuradas para controle de acesso
- [ ] Download usa signed URLs temporárias (1 hora de validade)
- [ ] Preview de HTML usa signed URL ou proxy autenticado

### Migração
- [ ] Script de migração para arquivos existentes em `data/outputs/`
- [ ] Arquivos migrados são registrados na tabela `documents` (sem owner)
- [ ] Apenas admin pode ver documentos migrados (até serem compartilhados)

## Dependências

### Backend (Python/Flask)
- `supabase` - Cliente oficial Supabase para Python (inclui Storage)
- `PyJWT>=2.8.0` - Validação de tokens JWT
- `python-dotenv` - Variáveis de ambiente (já existe)

### Frontend (React)
- `@supabase/supabase-js` - Cliente Supabase para JavaScript
- `react-router-dom` - Roteamento (migrar de tabs para rotas)

### Infraestrutura Supabase
- Supabase Auth - Autenticação email/senha
- Supabase Database (PostgreSQL) - Tabelas profiles, documents, document_shares
- Supabase Storage - Bucket `documents` para arquivos HTML/PDF

### Infraestrutura de Deploy (Railway)
- **Plataforma**: Railway (já em produção)
- **Volume**: `/app/data` (50GB) - dados persistentes
- **CI/CD**: GitHub Actions → Docker image → Railway
- **Fluxo de deploy**:
  1. `git push` para o repositório
  2. GitHub Actions builda a imagem Docker
  3. Railway usa a imagem gerada automaticamente

## Política de Acesso aos Endpoints

| Endpoint | Acesso | Observação |
|----------|--------|------------|
| `GET /api/health` | Público | Health check |
| `POST /api/convert` | **Admin** | Apenas admin converte |
| `POST /api/convert/file` | **Admin** | Apenas admin converte |
| `POST /api/convert/pdf` | **Admin** | Apenas admin converte |
| `POST /api/convert/file/pdf` | **Admin** | Apenas admin converte |
| `GET /api/files` | Autenticado | Admin vê todos, cliente vê compartilhados. Suporta paginação e busca. |
| `GET /api/download/<id>` | Autenticado | Verifica permissão, retorna signed URL |
| `GET /api/preview/<id>` | Autenticado | Verifica permissão, proxy ou signed URL |
| `DELETE /api/files/<id>` | Admin | Apenas admin pode deletar |
| `DELETE /api/files/all` | Admin | Apenas admin pode deletar todos |
| `GET /api/themes` | Admin | Apenas admin |
| `POST /api/themes` | Admin | Apenas admin |
| `PUT /api/themes/<name>` | Admin | Apenas admin |
| `DELETE /api/themes/<name>` | Admin | Apenas admin (tema "juridico" protegido) |
| `GET /api/clients` | Admin | Lista clientes |
| `POST /api/clients` | Admin | Cria cliente |
| `PUT /api/clients/<id>` | Admin | **Edita cliente (nome, reset senha)** |
| `DELETE /api/clients/<id>` | Admin | Remove cliente |
| `GET /api/documents/<id>/shares` | Admin | Lista compartilhamentos |
| `POST /api/documents/<id>/shares` | Admin | Compartilha documento |
| `DELETE /api/documents/<id>/shares/<client_id>` | Admin | Remove compartilhamento |
| `GET /api/me` | Autenticado | Perfil do usuário logado |

## Features Relacionadas

- Conversão de Markdown (existente) - documentos gerados serão registrados no banco e Storage
- FileManager (existente) - será adaptado para usar API autenticada + signed URLs
- ThemeManager (existente) - permanece apenas para admin
