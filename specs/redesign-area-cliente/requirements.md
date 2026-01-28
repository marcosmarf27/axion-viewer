# Requisitos: Redesign Area do Cliente

## Descricao

Redesign completo da area do cliente seguindo o design de referencia `docs/painel_cliente_axioma_v2.html`. A area atual usa paginas CRUD separadas com visual generico. O novo design consolida tudo em uma unica pagina com seletor de carteira na sidebar, tabela de casos com filtros, e modal para detalhes — estilo painel profissional juridico/financeiro.

Alem do redesign, corrigir 3 bugs criticos: metadados do processo vazios, download com "Token ausente", e preview HTML que nao abre.

## Decisoes do Usuario

- **Branding**: Manter "Axion Viewer" (nao trocar para "Axioma. Intelligence")
- **Abordagem**: Bugs + redesign tudo junto
- **Navegacao**: Single-page com modal (como mockup)

## Criterios de Aceitacao

### Bugs

- [ ] Metadados do processo exibidos corretamente (nao mais "-" em todos os campos)
- [ ] Download de documentos funciona sem erro "Token ausente"
- [ ] Preview de HTML abre corretamente em nova aba

### Layout do Cliente

- [ ] Sidebar light com logo "Axion Viewer" + subtitulo "Portal do Cliente"
- [ ] Seletor de carteira (dropdown) na sidebar carrega carteiras do usuario
- [ ] Filtros na sidebar: Tese, Recuperabilidade, UF, Periodo
- [ ] Botoes "Aplicar Filtros" e "Limpar Filtros" funcionais
- [ ] Info do usuario no rodape da sidebar (avatar + nome + role)
- [ ] Header com titulo "Meus Relatorios" e campo de busca

### Pagina Principal

- [ ] Stats grid com 4 cards: Carteira (highlight), Total Casos, Processos, Valor Total
- [ ] Tabela de casos com tabs por tese (Todos, NPL, RJ, Divida Ativa)
- [ ] Colunas: Caso/Devedor, Tese, Recuperab., Valor, Processos, Analise, Acoes
- [ ] Botoes de acao: download e visualizar detalhes
- [ ] Dados atualizam ao trocar carteira ou aplicar filtros

### Modal de Caso

- [ ] Header com nome do caso + devedor
- [ ] Grid de detalhes do caso (Credor, Tese, Recuperabilidade, Valor, UF, Data)
- [ ] Secao "Relatorio Consolidado" com botoes download HTML/PDF
- [ ] Lista de processos em cards com: CNJ, tipo acao, polo ativo/passivo, valor, tribunal/vara
- [ ] Botoes download por documento em cada processo (HTML, PDF)
- [ ] Download via axios (sem "Token ausente")

### Visual

- [ ] Fonte IBM Plex Sans
- [ ] Paleta: dark blue (#1a365d), gold (#8b6914), neutros
- [ ] Bordas sutis, sombras minimas, aspecto profissional
- [ ] Responsivo (sidebar colapsa em mobile)

### Integridade

- [ ] Area admin inalterada e funcional
- [ ] Bug fix do ProcessoDetail admin aplicado
- [ ] Build sem erros (`pnpm build`)
- [ ] Lint sem erros (`pnpm lint`)

## Dependencias

- React + Vite + Tailwind CSS v4 (frontend existente)
- API Flask com endpoints existentes (`/carteiras`, `/casos`, `/processos`, `/documentos`, `/dashboard/client`, `/preview/:id`)
- Supabase Auth (JWT via JWKS/ES256)
- Google Fonts (IBM Plex Sans)

## Features Relacionadas

- `specs/area-cliente-supabase/` — Area do Cliente com Auth Supabase (implementado, base para este redesign)
