# Ações Manuais: Migração MarkdownRenderer → Axion Viewer

Passos que precisam ser executados manualmente por um humano.

## Antes da Implementação

- [ ] **Ter credenciais do Supabase prontas** — URL do projeto, anon key, service role key e JWT secret. Serão solicitadas durante a Fase 5 para configurar o MCP e `.env`.

## Durante a Implementação

- [ ] **Fornecer credenciais Supabase ao Claude** — Quando solicitado na Fase 5, informar `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` para configurar o MCP server local.

## Após a Implementação

- [ ] **Configurar secrets no GitHub** — Ir em `github.com/marcosmarf27/axion-viewer` > Settings > Secrets and variables > Actions e adicionar:
  - `DOCKERHUB_USERNAME` = `marcosmarf27`
  - `DOCKERHUB_TOKEN` (criar/reusar token no Docker Hub)
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

- [ ] **Criar projeto no Railway** — Acessar o dashboard Railway e:
  - Criar novo projeto
  - Conectar ao repositório `marcosmarf27/axion-viewer`
  - Configurar volume `/app/data` (50GB)
  - Definir variáveis de ambiente: `PORT=8080`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`

- [ ] **Criar repositório no Docker Hub** (se necessário) — Criar repo `marcosmarf27/axion-viewer` no Docker Hub para receber as imagens do CI/CD.

---

> Estas ações também estão listadas em contexto no `implementation-plan.md`
