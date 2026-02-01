# Requisitos: Portal do Cliente v2.0

## Descricao

Redesign e melhorias de UX no Portal do Cliente do Axion Viewer, incluindo atualizacoes de branding, novos filtros, interacoes melhoradas na tabela de casos, e funcionalidades de edicao de perfil.

## Criterios de Aceitacao

### Tela de Login
- [ ] Branding esquerdo exibe "Axion Viewer" com subtitulo "Painel do Cliente"
- [ ] Rodape do formulario mostra copyright Axioma Intelligence 2026 e CNPJ
- [ ] Terminal direito exibe "Axion Viewer 2.0" (titulo) e "Powered by Axioma Intelligence" (subtitulo)

### Painel do Cliente (Sidebar)
- [ ] Icone do menu lateral usa logo.png (diamante) sem texto
- [ ] Filtro de data possui dois campos: Data Inicial e Data Final
- [ ] Tags de filtros aplicados aparecem abaixo dos botoes com "X" para remover
- [ ] Area do usuario mostra nome (negrito) e empresa do cliente
- [ ] Icone engrenagem abre modal de edicao de perfil (telefone e senha)

### Tabela de Casos
- [ ] Clique em qualquer area da linha abre o modal de detalhes
- [ ] Botao de download ao lado de "Ver" baixa relatorio principal
- [ ] Colunas sao ordenaveis com indicador visual (seta)
- [ ] Card carteira exibe "Varias" quando aba "Todos" com multiplas carteiras

### Modal Detalhes do Caso
- [ ] Secao renomeada para "Relatorio do Caso" com destaque visual dourado
- [ ] Botoes Ver e Baixar disponiveis para HTML e PDF
- [ ] Botoes esmaecidos com tooltip quando formato indisponivel
- [ ] Polo passivo com multiplos nomes exibe "Primeiro + N outros" com tooltip
- [ ] Label de valor alterado para "VALOR AJUIZADO"

## Dependencias

- Supabase (Auth, Storage, PostgreSQL)
- React + Vite + Tailwind CSS v4
- logo.png existente em frontend/public/

## Features Relacionadas

- Autenticacao Supabase (implementado)
- Area do Cliente read-only (implementado)
- Sistema de carteiras/casos/processos (implementado)
