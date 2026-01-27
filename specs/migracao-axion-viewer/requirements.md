# Requisitos: Migração MarkdownRenderer → Axion Viewer

## Descrição

Migrar o projeto MarkdownRenderer (Flask + React para conversão de Markdown em HTML/PDF) para um novo repositório chamado **axion-viewer**, renomeando todas as referências, configurando integração com Supabase e preparando o ambiente para deploy no Railway.

O projeto original é um conversor de documentos Markdown com temas profissionais (jurídico, corporativo, litigation), backend Flask com WeasyPrint para PDF, e frontend React 19 com Vite e shadcn/ui.

## Critérios de Aceitação

- [ ] Código fonte clonado do MarkdownRenderer para o diretório axion-viewer com histórico git limpo
- [ ] Repositório conectado ao remote `https://github.com/marcosmarf27/axion-viewer.git`
- [ ] Todas as referências a "MarkdownRenderer" / "markdownrenderer" renomeadas para "axion-viewer"
- [ ] Docker image name atualizado para `marcosmarf27/axion-viewer` em todos os arquivos
- [ ] CLAUDE.md atualizado com novo nome e informações do projeto
- [ ] MCP Supabase configurado no Claude Code (`.claude/settings.json` no projeto)
- [ ] Variáveis de ambiente Supabase documentadas em `.env.example`
- [ ] `.gitignore` atualizado para proteger credenciais
- [ ] GitHub Actions workflow atualizado com novo image name e build-args para Supabase
- [ ] Dockerfile preparado para receber variáveis Supabase no build do frontend
- [ ] `uv.lock` regenerado após renomeação no `pyproject.toml`
- [ ] Push inicial feito para o repositório axion-viewer no GitHub

## Dependências

- Repositório GitHub `marcosmarf27/axion-viewer` já criado (vazio)
- Projeto Supabase já criado com credenciais disponíveis (URL, anon key, service role key)
- Acesso ao Docker Hub para o novo image name
- Git e ferramentas de build (uv, pnpm, node) instalados localmente

## Features Relacionadas

- Integração Supabase (área cliente) — specs já existem no projeto original em `specs/area-cliente-supabase/`
- Deploy Railway — será configurado manualmente após a migração
- CI/CD via GitHub Actions — workflow existente será adaptado
