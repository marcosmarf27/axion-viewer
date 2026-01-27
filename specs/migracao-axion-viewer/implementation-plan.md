# Plano de Implementação: Migração MarkdownRenderer → Axion Viewer

## Visão Geral

Clonar o repositório MarkdownRenderer, limpar o histórico git, conectar ao novo repositório axion-viewer, renomear todas as referências, configurar Supabase (MCP + variáveis de ambiente), atualizar GitHub Actions e fazer o push inicial.

---

## Fase 1: Clone e Setup Git

Clonar o código fonte do MarkdownRenderer e configurar um repositório git limpo apontando para o novo remote.

### Tarefas

- [ ] Clonar MarkdownRenderer na pasta `/home/marcos/projetos/axion-viewer`
- [ ] Remover histórico git antigo (`.git/`)
- [ ] Inicializar novo repositório git com branch `main`
- [ ] Adicionar remote origin apontando para `axion-viewer.git`

### Detalhes Técnicos

```bash
git clone https://github.com/marcosmarf27/MarkdownRenderer.git /home/marcos/projetos/axion-viewer
cd /home/marcos/projetos/axion-viewer
rm -rf .git
git init
git branch -M main
git remote add origin https://github.com/marcosmarf27/axion-viewer.git
```

**Nota:** O diretório destino precisa estar vazio para o clone funcionar. Já verificamos que está vazio.

---

## Fase 2: Renomear Referências em Arquivos de Configuração

Substituir todas as ocorrências do nome antigo nos arquivos de build, Docker e config do projeto.

### Tarefas

- [ ] Renomear em `.github/workflows/docker-publish.yml` — `IMAGE_NAME`
- [ ] Renomear em `docker-compose.yml` — service name, image, container_name
- [ ] Renomear em `build-and-push.sh` — `IMAGE_NAME`
- [ ] Renomear em `test-local.sh` — `IMAGE_NAME` e refs `markdownrenderer-test`
- [ ] Renomear em `pyproject.toml` — `name = "markdowconverthtml"` → `"axion-viewer"`
- [ ] Atualizar `frontend/package.json` — `"name"` → `"axion-viewer-frontend"`
- [ ] Atualizar `frontend/index.html` — `<title>` → `Axion Viewer`

### Detalhes Técnicos

**Arquivos e linhas específicas:**

`.github/workflows/docker-publish.yml`:
```yaml
# Linha ~13
IMAGE_NAME: marcosmarf27/axion-viewer  # era marcosmarf27/markdownrenderer
```

`docker-compose.yml`:
```yaml
services:
  axion-viewer:                              # era markdownrenderer
    image: marcosmarf27/axion-viewer:latest  # era marcosmarf27/markdownrenderer:latest
    container_name: axion-viewer-dev         # era markdownrenderer-dev
```

`build-and-push.sh`:
```bash
IMAGE_NAME="axion-viewer"  # era "markdownrenderer"
```

`test-local.sh`:
```bash
IMAGE_NAME="axion-viewer"  # era "markdownrenderer"
# Todas as refs "markdownrenderer-test" → "axion-viewer-test"
```

`pyproject.toml`:
```toml
name = "axion-viewer"  # era "markdowconverthtml"
```

`frontend/package.json`:
```json
"name": "axion-viewer-frontend"  // era "frontend"
```

`frontend/index.html`:
```html
<title>Axion Viewer</title>  <!-- era "frontend" -->
```

**Arquivos que NÃO precisam de alteração:** `app.py`, `config.py`, `requirements.txt`, `Dockerfile` (estrutura), `frontend/src/**`, `frontend/vite.config.js`, `utils/**`, `templates/**`, `tests/**`

---

## Fase 3: Renomear Referências na Documentação

Substituir URLs e nomes do projeto em todos os arquivos de documentação.

### Tarefas

- [ ] Atualizar `README.md`
- [ ] Atualizar `DEPLOY_GUIDE.md`
- [ ] Atualizar `QUICK_START_DOCKER.md`
- [ ] Atualizar `GITHUB_ACTIONS_SETUP.md`
- [ ] Atualizar `specs/area-cliente-supabase/implementation-plan.md`
- [ ] Atualizar `specs/area-cliente-supabase/action-required.md`
- [ ] Remover `replit.md` e `.replit` (se existirem)

### Detalhes Técnicos

**Padrões de substituição global (todos os docs):**

| De | Para |
|----|------|
| `marcosmarf27/MarkdownRenderer` | `marcosmarf27/axion-viewer` |
| `marcosmarf27/markdownrenderer` | `marcosmarf27/axion-viewer` |
| `markdownrenderer` (minúsculo) | `axion-viewer` |
| `MarkdownRenderer` (CamelCase) | `Axion Viewer` (em títulos) ou `axion-viewer` (em código/URLs) |

---

## Fase 4: Atualizar CLAUDE.md

Reescrever o CLAUDE.md com o novo nome do projeto e informações atualizadas.

### Tarefas

- [ ] Renomear título para "Axion Viewer"
- [ ] Atualizar todas as URLs para o repo `axion-viewer`
- [ ] Atualizar Docker image name nas instruções
- [ ] Adicionar seção sobre MCP Supabase configurado
- [ ] Atualizar variáveis de ambiente documentadas

### Detalhes Técnicos

O CLAUDE.md atual já está bem estruturado. Alterações principais:
- Título: "Axion Viewer - Plataforma de conversão de documentos Markdown"
- URLs GitHub: `marcosmarf27/axion-viewer`
- Docker image: `marcosmarf27/axion-viewer`
- Nova seção: "MCP Supabase" informando que o plugin está configurado
- As variáveis Supabase já estão documentadas no CLAUDE.md original (seção área cliente)

---

## Fase 5: Configurar Ambiente Supabase

Preparar variáveis de ambiente, .gitignore e MCP server para integração com Supabase.

### Tarefas

- [ ] Criar/atualizar `.env.example` com variáveis Supabase
- [ ] Atualizar `.gitignore` para proteger credenciais
- [ ] Configurar MCP Supabase no projeto (`.claude/settings.json`) [complexo]
  - [ ] Criar diretório `.claude/` no projeto
  - [ ] Criar `settings.json` com configuração do MCP server
  - [ ] Solicitar credenciais ao usuário para preencher

### Detalhes Técnicos

**`.env.example`:**
```env
# Aplicação
PORT=8080
FLASK_ENV=production

# Supabase (Backend)
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=seu-jwt-secret

# Supabase (Frontend - build time)
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Adicionar ao `.gitignore`:**
```
.env
.env.local
.env.production
.claude/settings.json
```

**`.claude/settings.json` (project-level):**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "URL_FORNECIDA_PELO_USUARIO",
        "SUPABASE_SERVICE_ROLE_KEY": "KEY_FORNECIDA_PELO_USUARIO"
      }
    }
  }
}
```

**IMPORTANTE:** Credenciais reais serão solicitadas ao usuário durante execução. O `.claude/settings.json` NÃO será commitado (está no `.gitignore`).

---

## Fase 6: Atualizar GitHub Actions e Dockerfile

Preparar o CI/CD para o novo projeto com suporte a variáveis Supabase no build.

### Tarefas

- [ ] Adicionar `ARG`/`ENV` no Dockerfile para variáveis Supabase do frontend
- [ ] Adicionar `build-args` no workflow de GitHub Actions
- [ ] Verificar que o workflow referencia o image name correto (já feito na Fase 2)

### Detalhes Técnicos

**No `Dockerfile`, antes do `RUN pnpm build` no estágio de frontend:**
```dockerfile
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
```

**No `.github/workflows/docker-publish.yml`, no step de build:**
```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    push: ${{ github.event_name != 'pull_request' }}
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    build-args: |
      VITE_SUPABASE_URL=${{ secrets.VITE_SUPABASE_URL }}
      VITE_SUPABASE_ANON_KEY=${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

**Secrets a configurar no GitHub (manual):**
- `DOCKERHUB_USERNAME` = `marcosmarf27`
- `DOCKERHUB_TOKEN`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Fase 7: Regenerar Lock e Push Inicial

Finalizar a migração com regeneração do lock file e push para o repositório.

### Tarefas

- [ ] Executar `uv sync` para regenerar `uv.lock` com novo nome do projeto
- [ ] Fazer `git add` de todos os arquivos
- [ ] Criar commit inicial com mensagem descritiva
- [ ] Push para o remote `origin main`
- [ ] Verificar no GitHub que o push foi bem sucedido

### Detalhes Técnicos

```bash
cd /home/marcos/projetos/axion-viewer
uv sync  # regenera uv.lock com name = "axion-viewer"
git add -A
git commit -m "feat: initial migration from MarkdownRenderer to axion-viewer

- Renamed all references from MarkdownRenderer to axion-viewer
- Updated Docker image name to marcosmarf27/axion-viewer
- Updated GitHub Actions workflow with Supabase build-args
- Configured environment for Supabase integration
- Updated CLAUDE.md and documentation

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

git push -u origin main
```
