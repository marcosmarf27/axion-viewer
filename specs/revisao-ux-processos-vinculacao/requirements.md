# Requisitos: Revisao UX - Processos, Vinculacao e Tour Guiado

## Descricao

Revisao completa da experiencia de usuario nos fluxos de cadastro de processos, vinculacao de documentos, icones de acao e tour guiado do painel admin. Os problemas atuais incluem: selects sem busca que geram listagens enormes, icones de vinculacao confusos, formulario de processos desorganizado com 22+ campos sem agrupamento, e tour guiado sem opcao de desativar permanentemente.

## Criterios de Aceitacao

### Select com Busca (SearchableSelect)
- [ ] Componente reutilizavel `SearchableSelect` com campo de busca integrado
- [ ] Filtragem local em tempo real (case-insensitive)
- [ ] Navegacao por teclado (ArrowUp/Down, Enter, Escape)
- [ ] Click fora fecha o dropdown
- [ ] Suporte a `renderOption` customizado para exibir metadados (ex: caso_nome, tipo_acao)
- [ ] Campo "Caso" no formulario de processos usa SearchableSelect
- [ ] Campo "Processo Pai" no formulario de processos usa SearchableSelect
- [ ] Select de processo no modal "Vincular a Processo" (DocumentosPage) usa SearchableSelect
- [ ] Campo de busca de texto no modal "Vincular Documento" (ProcessoDetail)

### Icones de Acao
- [ ] Instalar lucide-react (tree-shakeable)
- [ ] Icone `Eye` para Preview nos botoes de acao
- [ ] Icone `Download` para Download nos botoes de acao
- [ ] Icone `Link2` para Vincular (icone de corrente — mais intuitivo que o SVG atual)
- [ ] Icone `Trash2` para Excluir nos botoes de acao
- [ ] Icones do sidebar (Layout.jsx) migrados para lucide-react
- [ ] Botao "Vincular Documento" no ProcessoDetail com icone `Link2`

### Formulario de Processos Agrupado
- [ ] Campos organizados em secoes logicas com headers visuais
- [ ] Secoes: Identificacao, Relacionamentos, Classificacao, Dados Judiciais, Valores, Movimentacao, Observacoes
- [ ] Cada secao com header `uppercase tracking-wide` e `border-b` como separador
- [ ] Campos dentro das secoes em grid 2 colunas
- [ ] Scroll suave no modal com `max-h-[90vh]`

### Tour Guiado - Opcao de Desativar
- [ ] Novo estado `hidden` no TourContext (diferente de `dismissed`)
- [ ] Quando `hidden=true`: card do dashboard nao renderiza, botao na sidebar nao aparece
- [ ] Botao "Nao mostrar novamente" no TourProgressCard que chama `hideTour()`
- [ ] Botao discreto `?` na sidebar para reativar quando hidden
- [ ] Tour nao auto-inicia quando `hidden=true`
- [ ] Estado `hidden` persiste no localStorage

## Dependencias

- `lucide-react` — biblioteca de icones tree-shakeable (a instalar)
- `@radix-ui/react-slot`, `clsx`, `tailwind-merge`, `class-variance-authority` (ja instalados)
- React 19 + Vite + Tailwind CSS v4 (stack atual)

## Features Relacionadas

- Fluxo CRUD de Processos (`ProcessosPage.jsx`, `ProcessoDetail.jsx`)
- Fluxo CRUD de Documentos (`DocumentosPage.jsx`)
- Tour Guiado Interativo (`TourContext.jsx`, `TourProgressCard.jsx`, `TourOverlay.jsx`)
- Layout Admin (`Layout.jsx`)
