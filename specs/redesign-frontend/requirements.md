# Requisitos: Redesign do Frontend

## Descricao

O frontend atual do Axion Viewer tem dois problemas criticos:

1. **Bug de layout**: O conteudo nao ocupa a tela toda. Ha um "espaco preto" visivel a direita e no topo causado por estilos padrao do template Vite que nunca foram removidos (`background-color: #242424`, `place-items: center`).

2. **Design generico**: A interface e funcional mas visualmente pobre — cards do dashboard sao quadrados coloridos sem icones, sidebar e cinza plano sem hierarquia, tabelas sao basicas sem refinamento, modais sao simples, e as cores nao sao harmonizadas.

O redesign e **puramente visual** — nenhuma funcionalidade sera alterada. Usar o skill `frontend-design` para gerar codigo de alta qualidade visual.

## Criterios de Aceitacao

- [ ] O conteudo ocupa 100% da largura disponivel da viewport (sem espaco preto)
- [ ] `#root`, `body` e `html` tem `width: 100%` e `height: 100%`
- [ ] Estilos padrao do Vite removidos de `index.css`
- [ ] `App.css` removido (arquivo orfao, nao importado por nenhum componente)
- [ ] Sidebar com gradiente, agrupamento de itens por secao, indicator lateral no item ativo
- [ ] Header com avatar circular do usuario (iniciais) e shadow sutil
- [ ] Stat cards do Dashboard com icones SVG reais (nao div vazio)
- [ ] Todas as tabelas admin e client com padrao visual consistente (hover, rounded, spacing)
- [ ] Modais com backdrop blur e rounded-xl
- [ ] Componentes reutilizaveis (EmptyState, Pagination, ConfirmDialog, LoadingSpinner) polidos
- [ ] LoginPage com ajustes cosmeticos (animacao Matrix intacta)
- [ ] Build passa sem erros (`pnpm build`)
- [ ] Layout responsivo funcional (sidebar mobile com hamburguer)
- [ ] Paleta de cores harmonizada usando Tailwind nativo (indigo como primaria)

## Dependencias

- Tailwind CSS v4 (ja instalado via `@tailwindcss/vite`)
- shadcn/ui (ja configurado, style: new-york)
- Funcao `cn()` de `@/lib/utils` (ja existente)

## Features Relacionadas

- `specs/animacao-login-matrix/` — Animacao Matrix na tela de login (manter intacta)
- `specs/area-cliente-supabase/` — Area do Cliente com Auth Supabase (ja implementada)
