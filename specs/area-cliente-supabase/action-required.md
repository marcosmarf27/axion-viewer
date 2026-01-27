# Ações Manuais: Área do Cliente com Autenticação Supabase

Passos que precisam ser executados manualmente por um humano.

---

## Fase 0: Preparação (Antes de Tudo)

- [ ] **Fazer backup de `data/outputs/`** - Copiar pasta para local seguro antes da migração
  ```bash
  tar -czvf backup_outputs_$(date +%Y%m%d).tar.gz data/outputs/
  ```

---

## Fase 1: Criar Projeto Supabase

- [ ] **Criar conta no Supabase** - Acessar https://supabase.com e criar conta (se não tiver)

- [ ] **Criar projeto Supabase** - No dashboard:
  1. Clicar em "New project"
  2. Escolher organização
  3. Nome do projeto: `axion-viewer` (ou similar)
  4. Região: `South America (São Paulo)` - `sa-east-1` (recomendado para Brasil)
  5. Senha do banco: gerar senha forte e **anotar**
  6. Aguardar provisionamento (~2 min)

- [ ] **Coletar credenciais do projeto** - Em Settings > API, anotar:
  | Credencial | Onde encontrar | Usar em |
  |------------|----------------|---------|
  | Project URL | Settings > API | Backend + Frontend |
  | anon key (public) | Settings > API | Frontend |
  | service_role key | Settings > API | Backend (NUNCA expor!) |
  | JWT Secret | Settings > API > JWT Settings | Backend |

---

## Fase 1.5: Configurar Storage

- [ ] **Criar bucket `documents`** - No Dashboard:
  1. Ir em Storage > New bucket
  2. Nome: `documents`
  3. Public bucket: **NÃO** (manter privado)
  4. File size limit: 50 MB
  5. Allowed MIME types: `text/html`, `application/pdf`

- [ ] **Executar SQL das políticas do Storage** - No SQL Editor:
  1. Copiar SQLs de políticas RLS do Storage do `implementation-plan.md` (Fase 1.5)
  2. Executar cada política

---

## Fase 1: Executar Migrations SQL

- [ ] **Executar SQL das tabelas** - No SQL Editor do Supabase:
  1. Copiar e executar SQL da tabela `profiles`
  2. Copiar e executar SQL da tabela `documents` (com `storage_path`)
  3. Copiar e executar SQL da tabela `document_shares`
  4. Copiar e executar SQL do trigger `handle_new_user`
  5. Copiar e executar SQLs de RLS (habilitar + políticas)

- [ ] **Verificar tabelas criadas** - Em Table Editor, confirmar:
  - [ ] Tabela `profiles` existe com colunas corretas
  - [ ] Tabela `documents` existe com coluna `storage_path`
  - [ ] Tabela `document_shares` existe
  - [ ] RLS está habilitado em todas (cadeado fechado)

---

## Fase 1: Criar Usuário Admin

- [ ] **Criar usuário admin inicial** - No Dashboard:
  1. Ir em Authentication > Users > Add user
  2. Email: seu email de admin
  3. Password: senha forte
  4. Clicar em "Create user"

- [ ] **Promover para admin** - No SQL Editor:
  ```sql
  UPDATE public.profiles
  SET role = 'admin'
  WHERE email = 'seu-email@admin.com';
  ```

- [ ] **Verificar** - Consultar:
  ```sql
  SELECT id, email, role FROM public.profiles;
  ```

---

## Fase 2-3: Configurar Variáveis de Ambiente

- [ ] **Criar arquivo `.env` no backend** - Na raiz do projeto:
  ```env
  # Flask
  PORT=8080
  FLASK_ENV=development

  # Supabase - Backend
  SUPABASE_URL=https://xxxxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
  SUPABASE_JWT_SECRET=your-jwt-secret
  ```

- [ ] **Criar arquivo `.env` no frontend** - Em `frontend/`:
  ```env
  VITE_SUPABASE_URL=https://xxxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJ...
  ```

- [ ] **Adicionar `.env` ao `.gitignore`** - Se ainda não estiver:
  ```
  .env
  frontend/.env
  ```

---

## Fase 6: Testar Implementação

- [ ] **Testar login como admin**
  1. Acessar aplicação
  2. Fazer login com email/senha do admin
  3. Verificar se vê dashboard admin com estatísticas

- [ ] **Testar criação de cliente**
  1. Ir em "Clientes"
  2. Criar novo cliente
  3. Verificar se aparece na lista

- [ ] **Testar edição de cliente**
  1. Clicar em "Editar" em um cliente
  2. Alterar nome e salvar
  3. Testar "Resetar Senha" e anotar nova senha temporária
  4. Testar login do cliente com nova senha

- [ ] **Testar conversão (apenas admin)**
  1. Como admin, converter um markdown
  2. Verificar se documento aparece na lista
  3. Verificar se está no Storage (Dashboard > Storage > documents)
  4. Logout e login como cliente
  5. Verificar que cliente NÃO tem acesso à conversão (403)

- [ ] **Testar compartilhamento via modal**
  1. Como admin, ir em Documentos
  2. Clicar "Compartilhar" em um documento
  3. Selecionar clientes com checkboxes
  4. Salvar e verificar marcação
  5. Fazer logout e login como cliente
  6. Verificar se vê apenas documento compartilhado

- [ ] **Testar paginação e busca**
  1. Criar vários documentos (>10)
  2. Verificar paginação no rodapé
  3. Navegar entre páginas
  4. Testar busca por nome/título
  5. Testar filtro por tipo (HTML/PDF)

---

## Fase 7: Migração de Arquivos

> **NOTA**: Na Railway, os arquivos existentes estão em `/app/data/outputs/` (volume persistente).
> A migração pode ser executada localmente (se tiver cópia) ou via Railway CLI/shell.

- [ ] **Opção A: Migrar localmente** (se tiver backup dos arquivos):
  ```bash
  # Configurar variáveis
  export SUPABASE_URL=https://xxxxx.supabase.co
  export SUPABASE_SERVICE_ROLE_KEY=eyJ...

  # Executar migração
  uv run python scripts/migrate_files.py
  ```

- [ ] **Opção B: Migrar via Railway** (recomendado):
  ```bash
  # Usar Railway CLI para executar no container de produção
  railway run python scripts/migrate_files.py
  ```

- [ ] **Verificar migração** - No SQL Editor do Supabase:
  ```sql
  SELECT filename, storage_path, created_by
  FROM documents
  WHERE created_by IS NULL;
  ```

- [ ] **Verificar no Storage** - Dashboard Supabase > Storage > documents
  - Pastas `html/` e `pdf/` devem ter os arquivos

- [ ] **Limpar arquivos do volume Railway (opcional)** - Após confirmar migração:
  ```bash
  railway run rm -rf /app/data/outputs/*
  ```
  > ⚠️ Só execute após confirmar que todos os arquivos estão no Supabase Storage!

---

## Deploy: Configurar Ambiente de Produção (Railway)

> **IMPORTANTE**: A aplicação já está em produção na Railway com volume em `/app/data` (50GB).
> O fluxo de deploy é: `git push` → GitHub Actions → Docker image → Railway

### GitHub Actions

- [ ] **Adicionar secrets no repositório** - Settings > Secrets > Actions:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_JWT_SECRET`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

- [ ] **Verificar workflow do GitHub Actions** (`.github/workflows/`):
  - Build args para variáveis VITE_* devem ser passados durante o build da imagem
  ```yaml
  - name: Build Docker image
    run: |
      docker build \
        --build-arg VITE_SUPABASE_URL=${{ secrets.VITE_SUPABASE_URL }} \
        --build-arg VITE_SUPABASE_ANON_KEY=${{ secrets.VITE_SUPABASE_ANON_KEY }} \
        -t axion-viewer .
  ```

### Railway

- [ ] **Configurar variáveis de ambiente** no dashboard Railway:
  - `SUPABASE_URL` - URL do projeto Supabase
  - `SUPABASE_SERVICE_ROLE_KEY` - Chave service role (backend)
  - `SUPABASE_JWT_SECRET` - Secret para validar JWT
  - Variáveis `VITE_*` são injetadas no build via GitHub Actions

- [ ] **Verificar volume existente**:
  - Mount path: `/app/data`
  - Arquivos existentes em `/app/data/outputs/` serão migrados para Supabase Storage
  - Após migração confirmada, pasta `/app/data/outputs/` pode ser limpa

### Docker / Docker Compose (desenvolvimento local)

- [ ] **Atualizar docker-compose.yml** com variáveis Supabase:
  ```yaml
  environment:
    - SUPABASE_URL=${SUPABASE_URL}
    - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    - SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET}
  ```

---

## Troubleshooting

### Erro: "Token inválido ou expirado"
- Verificar se JWT Secret está correto
- Verificar se token não expirou (padrão: 1 hora)

### Erro: "Acesso negado" para cliente
- Verificar se documento foi compartilhado
- Consultar `document_shares` no banco

### Erro: "403 Forbidden" ao converter
- Verificar se usuário é admin
- Consultar `profiles` no banco: `SELECT role FROM profiles WHERE id = 'user-id'`

### Erro no upload para Storage
- Verificar se bucket existe
- Verificar políticas RLS do Storage
- Verificar se MIME type é permitido

### Arquivos não aparecem após migração
- Verificar logs do script de migração
- Consultar tabela `documents` no banco
- Verificar se arquivos estão no Storage

### Erro ao resetar senha de cliente
- Verificar se service_role_key está configurado corretamente
- Verificar logs do Supabase Auth

### Paginação não funciona corretamente
- Verificar query params na URL da API
- Verificar se métodos do supabase_client retornam tuple (data, count)
- Testar query diretamente no SQL Editor do Supabase

---

## Ordem de Execução Recomendada

```
1. Backup (Fase 0) - Baixar arquivos de /app/data/outputs/ da Railway
2. Criar projeto Supabase (Fase 1)
3. Criar bucket Storage (Fase 1.5)
4. Executar SQLs (Fase 1)
5. Criar admin (Fase 1)
6. Configurar .env local (Fase 2-3)
7. Implementar código (Fases 2-5)
8. Testar localmente (Fase 6)
9. Configurar secrets no GitHub Actions
10. Configurar variáveis na Railway
11. Deploy via git push
12. Testar em produção
13. Migrar arquivos via Railway CLI (Fase 7)
14. Confirmar migração e limpar volume (opcional)
```

---

> **Nota**: Estas ações também estão detalhadas em contexto no `implementation-plan.md`
