# Acoes Manuais: Area do Cliente Completa

Passos que precisam ser executados manualmente por um humano.

## Antes da Implementacao

- [ ] **Backup dos arquivos de producao** - Executar `railway run tar -czvf /app/data/backup_pre_migration.tar.gz /app/data/outputs/` para garantir backup antes de qualquer mudanca

## Durante a Implementacao — Ciclo 1 (Infra + Auth + Blueprints)

- [ ] **Executar migrations SQL no Supabase** - As 10 migrations serao aplicadas via MCP `apply_migration` durante a implementacao. Verificar no Supabase Dashboard que todas as tabelas, enums, triggers e policies foram criadas corretamente
- [ ] **Verificar indices criados** - Confirmar no Supabase Dashboard > Database > Indexes que todos os indices listados nas migrations existem (especialmente os de FK usados em RLS policies)
- [ ] **Testar RLS policies** - Apos aplicar Migration 8, testar manualmente no SQL Editor do Supabase:
  - Como admin: deve ver todos os registros
  - Como client: deve ver apenas registros de carteiras com acesso concedido
  - Documentos sem processo_id: invisiveis para clients
- [ ] **Criar bucket Storage no Supabase** - O bucket `documents` (privado) sera criado via migration SQL. Verificar no Dashboard > Storage que o bucket existe com as policies corretas
- [ ] **Criar usuario admin no Supabase Auth** - Acessar Supabase Dashboard > Authentication > Users > Add User. Criar com email e senha. Depois executar: `UPDATE profiles SET role = 'admin' WHERE email = 'EMAIL_DO_ADMIN'`
- [ ] **Testar Docker build com UV** - Apos migrar Dockerfile para UV, executar `docker build -t axion:test .` localmente e verificar que todas as dependencias sao instaladas corretamente (especialmente `supabase` e `PyJWT`)

## Durante a Implementacao — Ciclo 2 (Admin CRUD + Dashboard)

- [ ] **Testar triggers de contagem** - Apos criar casos e processos, verificar que os campos `qtd_casos` e `qtd_processos` na tabela `carteiras` sao atualizados automaticamente
- [ ] **Testar cleanup de Storage** - Simular falha de INSERT apos upload e verificar que arquivo orfao e removido do Storage
- [ ] **Testar delete cascade** - Deletar um cliente e verificar que:
  - Todas as carteiras, casos, processos e documentos sao deletados do banco
  - Arquivos correspondentes sao removidos do Storage (via logica backend)

## Durante a Implementacao — Ciclo 3 (Frontend + Area Cliente)

- [ ] **Testar sessao persistente** - Fazer login, fechar aba, reabrir — sessao deve persistir (autoRefreshToken + persistSession)
- [ ] **Testar responsividade** - Verificar layout em mobile (< 768px), tablet e desktop
- [ ] **Testar drill-down do cliente** - Navegar carteira → casos → processos → documento → download

## Apos a Implementacao

- [ ] **Configurar variaveis de ambiente no Railway** - Verificar que `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estao configuradas (ja devem estar segundo CLAUDE.md)
- [ ] **Verificar GitHub Actions secrets** - Confirmar que `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estao nos secrets do repositorio (ja devem estar segundo CLAUDE.md)
- [ ] **Executar script de migracao em producao** - Apos deploy, executar `railway run python scripts/migrate_files.py` para migrar arquivos existentes do filesystem para Supabase Storage
- [ ] **Verificar migracao no Supabase Dashboard** - Conferir no Dashboard > Storage que os arquivos foram migrados. Conferir na tabela `documentos` que os registros foram criados
- [ ] **Testar login admin** - Acessar a aplicacao em producao, fazer login com a conta admin criada, verificar dashboard e funcionalidades
- [ ] **Testar fluxo completo** - Converter documento, cadastrar cliente > carteira > caso > processo, vincular documento, criar conta cliente, associar carteira, logar como cliente e verificar acesso

## Plano de Rollback (se necessario)

- [ ] **Rollback Schema** - Executar `DROP TABLE` em ordem reversa (cliente_carteira_access, documentos, processos, casos, carteiras, clientes, profiles) e `DROP TYPE` para enums
- [ ] **Rollback Dockerfile** - Restaurar Dockerfile antigo: `git checkout main -- Dockerfile requirements.txt`
- [ ] **Rollback app.py** - Restaurar app.py original: `git checkout main -- app.py`
- [ ] **Rollback Frontend** - Restaurar frontend original: `git checkout main -- frontend/src/App.jsx frontend/src/main.jsx`
- [ ] **Rollback Storage** - Arquivos locais em `data/outputs/` preservados como backup; reverter para servir do filesystem

---

> Estas acoes tambem estao listadas em contexto no `implementation-plan.md`
