# Plano de Implementacao: Redesign do Frontend

## Visao Geral

Redesign visual completo do frontend React do Axion Viewer. Correcao do bug de layout (espaco preto) e melhoria do design de todas as paginas (sidebar, header, dashboard, tabelas, modais, componentes). Usar o skill `frontend-design` para gerar codigo visual de alta qualidade.

## Fase 1: Corrigir Bug de Layout (CRITICO)

Remover estilos padrao do Vite que causam o espaco preto e conflitam com Tailwind.

### Tarefas

- [ ] Reescrever `frontend/src/index.css` — remover TODOS os estilos Vite, manter apenas Tailwind + reset minimo
- [ ] Deletar `frontend/src/App.css` — arquivo orfao (nao importado por nenhum componente)
- [ ] Verificar que `pnpm build` passa sem erros

### Detalhes Tecnicos

**`frontend/src/index.css`** — Substituir todo o conteudo por:

```css
@import 'tailwindcss';

/* Reset minimo */
html,
body,
#root {
  height: 100%;
  width: 100%;
}

body {
  margin: 0;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f8fafc; /* slate-50 */
}
```

**O que e removido e por que:**

| Estilo Vite | Problema |
|-------------|----------|
| `:root { background-color: #242424; }` | Fundo preto visivel |
| `body { display: flex; place-items: center; }` | Centraliza ao inves de expandir |
| `button { background-color: #1a1a1a; }` | Botoes escuros por padrao |
| `a { color: #646cff; }` | Links roxo-neon |
| `h1 { font-size: 3.2em; }` | Titulos gigantes |
| `color-scheme: light dark;` + media query | Conflito de tema com Tailwind |

**`frontend/src/App.css`** — Deletar completamente. Confirmado que NENHUM componente importa este arquivo. Os componentes legados (ThemeManager.jsx, ApiDocs.jsx, FileManager.jsx) tambem sao orfaos — nao sao importados por nenhuma pagina.

## Fase 2: Redesign do Layout Principal (Sidebar + Header)

Redesenhar o componente central que afeta TODAS as paginas protegidas.

### Tarefas

- [ ] Redesenhar a sidebar em `frontend/src/components/Layout.jsx` [complexo]
  - [ ] Gradiente de fundo (`slate-900` → `slate-950`)
  - [ ] Logo/brand com icone SVG (balanca da justica ou similar)
  - [ ] Agrupamento de itens por secao (PRINCIPAL, GESTAO, FERRAMENTAS, SISTEMA)
  - [ ] Indicator lateral no item ativo (`border-l-2 border-indigo-400` + `bg-indigo-600/20`)
  - [ ] Hover melhorado (`hover:bg-white/5 hover:text-gray-200`)
- [ ] Redesenhar o header em `frontend/src/components/Layout.jsx`
  - [ ] Adicionar `shadow-sm` para profundidade
  - [ ] Avatar circular com iniciais do usuario
  - [ ] Botao Sair com icone de logout e hover vermelho sutil
- [ ] Verificar layout mobile (hamburguer + overlay)

### Detalhes Tecnicos

**Arquivo**: `frontend/src/components/Layout.jsx`

**Agrupamento de itens da sidebar admin:**

```javascript
const adminNavGroups = [
  {
    label: 'PRINCIPAL',
    items: [
      { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
    ],
  },
  {
    label: 'GESTAO',
    items: [
      { label: 'Clientes', path: '/admin/clientes', icon: 'Users' },
      { label: 'Carteiras', path: '/admin/carteiras', icon: 'Briefcase' },
      { label: 'Casos', path: '/admin/casos', icon: 'FolderOpen' },
      { label: 'Processos', path: '/admin/processos', icon: 'Scale' },
      { label: 'Documentos', path: '/admin/documentos', icon: 'FileText' },
    ],
  },
  {
    label: 'FERRAMENTAS',
    items: [
      { label: 'Converter', path: '/admin/convert', icon: 'FileOutput' },
      { label: 'Temas', path: '/admin/themes', icon: 'Palette' },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { label: 'Contas', path: '/admin/accounts', icon: 'UserCog' },
      { label: 'Compartilhamento', path: '/admin/sharing', icon: 'Share2' },
    ],
  },
];
```

**Sidebar ativo** — trocar `bg-gray-800 text-white` por:
```
bg-indigo-600/20 text-white border-l-2 border-indigo-400
```

**Avatar do usuario no header:**
```jsx
const initials = profile?.full_name
  ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  : profile?.email?.[0]?.toUpperCase() || '?';

<div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-700">
  {initials}
</div>
```

## Fase 3: Redesign do Dashboard Admin

Redesenhar stat cards, charts, atividade recente e acoes rapidas.

### Tarefas

- [ ] Redesenhar stat cards com icones SVG reais em `frontend/src/pages/admin/AdminDashboard.jsx` [complexo]
  - [ ] Adicionar icones SVG no array `statCards` (um por metrica)
  - [ ] Card com borda lateral colorida (`border-l-4 border-{cor}`)
  - [ ] Icone em circulo colorido (`rounded-full bg-{cor}-100 p-2.5`)
  - [ ] Hover com shadow e translate (`hover:shadow-lg hover:-translate-y-0.5 transition-all`)
- [ ] Melhorar secao de charts (container, legenda)
- [ ] Melhorar Atividade Recente (icones de tipo de arquivo, hover states)
- [ ] Transformar Acoes Rapidas em cards com icone + label

### Detalhes Tecnicos

**Arquivo**: `frontend/src/pages/admin/AdminDashboard.jsx`

**Stat cards atuais (problema)** — linha 137-139:
```jsx
<div className={`mb-2 inline-block rounded-md ${card.color} p-2`}>
  <div className="h-4 w-4 text-white" /> {/* DIV VAZIO — sem icone! */}
</div>
```

**Stat cards redesenhados** — cada card recebe um icone SVG:
```javascript
const statCards = [
  {
    key: 'total_clientes',
    label: 'Clientes Ativos',
    color: 'blue',
    path: '/admin/clientes',
    icon: /* SVG de Users */,
  },
  // ... etc
];
```

**Layout do card:**
```jsx
<Link to={card.path} className="flex items-center gap-4 rounded-xl border-l-4 border-{color}-500 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-{color}-100">
    <CardIcon className="h-6 w-6 text-{color}-600" />
  </div>
  <div>
    <p className="text-sm text-gray-500">{card.label}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </div>
</Link>
```

## Fase 4: Redesign das Paginas de Tabela (Admin)

Aplicar padrao visual consistente em todas as 10 paginas admin que usam tabelas.

### Tarefas

- [ ] Redesenhar `frontend/src/pages/admin/ClientesPage.jsx` (referencia para as demais)
- [ ] Redesenhar `frontend/src/pages/admin/CarteirasPage.jsx`
- [ ] Redesenhar `frontend/src/pages/admin/CasosPage.jsx`
- [ ] Redesenhar `frontend/src/pages/admin/ProcessosPage.jsx`
- [ ] Redesenhar `frontend/src/pages/admin/ProcessoDetail.jsx`
- [ ] Redesenhar `frontend/src/pages/admin/DocumentosPage.jsx`
- [ ] Redesenhar `frontend/src/pages/admin/ConvertPage.jsx`
- [ ] Redesenhar `frontend/src/pages/admin/ThemesPage.jsx`
- [ ] Redesenhar `frontend/src/pages/admin/AccountsPage.jsx`
- [ ] Redesenhar `frontend/src/pages/admin/SharingPage.jsx`

### Detalhes Tecnicos

**Padrao de tabela a aplicar em TODAS as paginas:**

| Elemento | Antes | Depois |
|----------|-------|--------|
| Container tabela | `rounded-lg border bg-white shadow-sm` | `overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm` |
| Thead | `border-b bg-gray-50` | `bg-gray-50/80` |
| Th | `text-xs font-medium uppercase text-gray-500` | `text-xs font-semibold uppercase tracking-wider text-gray-500` |
| Tbody rows | `hover:bg-gray-50` | `hover:bg-indigo-50/40 transition-colors` |
| Botoes acao | `text-sm font-medium text-indigo-600` | `rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors` |
| Cabecalho pagina | `text-2xl font-bold` apenas | Adicionar subtitulo `text-sm text-gray-500` |
| Botao primario | `bg-indigo-600 px-4 py-2` | Adicionar `shadow-sm` |

**Padrao de inputs nos filtros:**
```
rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm
transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
```

**Padrao de modais (aplicar em cada pagina com modal):**
```jsx
{/* Overlay */}
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
  {/* Modal */}
  <div className="w-full max-w-{size} rounded-xl bg-white p-6 shadow-xl">
    {/* Header com border-b */}
    <div className="mb-4 flex items-center justify-between border-b pb-4">
      <h2 className="text-lg font-semibold text-gray-900">Titulo</h2>
      <button className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
        {/* icone X */}
      </button>
    </div>
    {/* Conteudo */}
  </div>
</div>
```

## Fase 5: Redesign das Paginas Client

Aplicar mesmo padrao visual das paginas admin nas 5 paginas do portal do cliente.

### Tarefas

- [ ] Redesenhar `frontend/src/pages/client/ClientDashboard.jsx`
- [ ] Redesenhar `frontend/src/pages/client/ClientCarteirasPage.jsx`
- [ ] Redesenhar `frontend/src/pages/client/ClientCasosPage.jsx`
- [ ] Redesenhar `frontend/src/pages/client/ClientProcessosPage.jsx`
- [ ] Redesenhar `frontend/src/pages/client/ClientProcessoDetail.jsx`

### Detalhes Tecnicos

Mesmos padroes de tabela e cards da Fase 4. O ClientDashboard recebe as mesmas melhorias de stat cards da Fase 3 (icones SVG, borda lateral, hover com translate).

## Fase 6: Redesign de Componentes Reutilizaveis

Polir os componentes base usados em todas as paginas.

### Tarefas

- [ ] Redesenhar `frontend/src/components/EmptyState.jsx` — fundo sutil, SVG maior e mais elegante
- [ ] Redesenhar `frontend/src/components/LoadingSpinner.jsx` — spinner mais sofisticado
- [ ] Redesenhar `frontend/src/components/Pagination.jsx` — botoes rounded-lg, pagina ativa com shadow
- [ ] Redesenhar `frontend/src/components/ConfirmDialog.jsx` — backdrop blur, icone de alerta, rounded-xl

### Detalhes Tecnicos

**EmptyState** — container com `rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-12`
**LoadingSpinner** — usar `border-4 border-indigo-200 border-t-indigo-600` com animacao `animate-spin`
**Pagination** — botao ativo: `bg-indigo-600 text-white shadow-sm rounded-lg`
**ConfirmDialog** — overlay com `backdrop-blur-sm`, icone triangulo de alerta `text-red-500` no topo

## Fase 7: Ajustes na LoginPage

Ajustes cosmeticos minimos mantendo a animacao Matrix intacta.

### Tarefas

- [ ] Ajustar `frontend/src/pages/LoginPage.jsx`
  - [ ] Painel esquerdo: `bg-white` ao inves de `bg-gray-50`
  - [ ] Card do formulario: `rounded-xl shadow-md`
  - [ ] Titulo "Axion Viewer" com gradiente de texto
  - [ ] Botao submit com `shadow-sm transition-all`
- [ ] Manter animacao MatrixRainCanvas intacta (nao alterar)

### Detalhes Tecnicos

**Arquivo**: `frontend/src/pages/LoginPage.jsx`

**Gradiente no titulo:**
```jsx
<h1 className="bg-gradient-to-r from-gray-900 to-indigo-600 bg-clip-text text-transparent text-2xl font-bold">
  Axion Viewer
</h1>
```

## Paleta de Cores (referencia)

Todas as cores sao nativas do Tailwind — nenhuma cor customizada.

| Uso | Classe Tailwind |
|-----|-----------------|
| Primaria (botoes, links) | `indigo-600` |
| Primaria hover | `indigo-700` |
| Primaria light (badges, bg) | `indigo-50` / `indigo-100` |
| Sidebar background | `slate-900` / `slate-950` |
| Sidebar accent | `indigo-400` |
| Background principal | `slate-50` (#f8fafc) |
| Cards | `white` |
| Texto primario | `gray-900` |
| Texto secundario | `gray-500` |
| Bordas | `gray-200` |
| Success | `emerald-600` |
| Warning | `amber-500` |
| Danger | `red-600` |
