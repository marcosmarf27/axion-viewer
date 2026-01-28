# Plano de Implementacao: Redesign Area do Cliente

## Visao Geral

Redesign da area do cliente de multi-pagina CRUD para single-page profissional com sidebar de filtros, tabela de casos e modal de detalhes. Inclui correcao de 3 bugs criticos (metadados vazios, download sem token, preview HTML). Design baseado no mockup `docs/painel_cliente_axioma_v2.html`.

## Fase 1: Fonte e Configuracao Visual

Adicionar fonte IBM Plex Sans e configurar paleta de cores.

### Tarefas

- [x] Adicionar link Google Fonts (IBM Plex Sans + IBM Plex Mono) no `frontend/index.html`
- [x] Configurar font-family no CSS global para area do cliente

### Detalhes Tecnicos

**`frontend/index.html`** — adicionar no `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Paleta de cores (CSS variables ou classes Tailwind inline):**
```css
--color-accent: #1a365d;        /* dark blue principal */
--color-accent-hover: #234578;
--color-accent-subtle: rgba(26, 54, 93, 0.06);
--color-accent-gold: #8b6914;   /* gold para destaques */
--color-accent-gold-subtle: rgba(139, 105, 20, 0.08);
--color-bg: #f5f6f8;
--color-border: #dfe1e5;
--color-border-subtle: #e8eaed;
--color-text: #1a1d21;
--color-text-muted: #5f6368;
--color-text-subtle: #80868b;
```

## Fase 2: Fix Bug Admin ProcessoDetail

Corrigir bug de extracao de dados e download no admin (mesmo bug existe no cliente, mas sera resolvido pelo redesign).

### Tarefas

- [x] Fix `setProcesso(data)` → `setProcesso(data.data)` em `admin/ProcessoDetail.jsx:171`
- [x] Substituir link download `<a href="/api/download/...">` por handler axios em `admin/ProcessoDetail.jsx`
- [x] Substituir link preview por handler axios em `admin/ProcessoDetail.jsx`

### Detalhes Tecnicos

**`frontend/src/pages/admin/ProcessoDetail.jsx`**

Bug na linha 170-171:
```jsx
// ANTES (bug):
const { data } = await api.get(`/processos/${id}`);
setProcesso(data);  // data = {success: true, data: {...}} - wrapper inteiro

// DEPOIS (fix):
const { data } = await api.get(`/processos/${id}`);
setProcesso(data.data);  // extrai o processo real
```

Resposta do backend (`routes/processos_routes.py:75`):
```python
return jsonify({"success": True, "data": processo})
```

Download handler (substituir `<a href="/api/download/...">` nas linhas 404-409):
```jsx
const handleDownload = async (docId) => {
  try {
    const { data } = await api.get(`/preview/${docId}`);
    if (data.signed_url) {
      const link = document.createElement('a');
      link.href = data.signed_url;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch {
    alert('Erro ao baixar documento');
  }
};

const handlePreview = async (docId) => {
  try {
    const { data } = await api.get(`/preview/${docId}`);
    if (data.signed_url) {
      window.open(data.signed_url, '_blank');
    }
  } catch {
    alert('Erro ao abrir preview');
  }
};
```

Endpoint backend usado (`routes/files_routes.py:42-57`):
```python
@files_bp.route("/api/preview/<document_id>", methods=["GET"])
@auth_required
def preview_document(document_id):
    doc = supa_service.get_documento(document_id)
    signed_url = supa_service.get_signed_url(doc["storage_path"])
    return jsonify({"success": True, "signed_url": signed_url})
```

## Fase 3: Criar ClientLayout.jsx [complexo]

Layout exclusivo para area do cliente com sidebar light, seletor de carteira e filtros.

### Tarefas

- [x] Criar componente `ClientLayout.jsx` com sidebar + header + area principal
  - [x] Sidebar light com logo, seletor de carteira, filtros, info usuario
  - [x] Header com titulo e campo de busca
  - [x] Area principal renderiza `<Outlet />`
- [x] Gerenciar estado dos filtros e carteira selecionada via context ou props
- [x] Implementar responsividade (sidebar colapsa em mobile)

### Detalhes Tecnicos

**Arquivo**: `frontend/src/components/ClientLayout.jsx`

**Estrutura:**
```
┌─────────────────────────────────────────────────────┐
│ Sidebar (260px, fixed)  │  Main Content             │
│                         │                           │
│ [Logo: Axion Viewer]    │  Header (sticky)          │
│ [Portal do Cliente]     │  ┌─────────────────────┐  │
│                         │  │ Meus Relatorios     │  │
│ ── CARTEIRA ──          │  │ [Search box]        │  │
│ [Dropdown selector]     │  └─────────────────────┘  │
│                         │                           │
│ ── FILTROS ──           │  Content (<Outlet />)     │
│ [Tese        v]         │  ┌─────────────────────┐  │
│ [Recuperab.  v]         │  │ Stats + Tabela      │  │
│ [UF          v]         │  │                     │  │
│ [Periodo     📅]        │  │                     │  │
│                         │  └─────────────────────┘  │
│ [Aplicar Filtros]       │                           │
│ [Limpar Filtros]        │                           │
│                         │                           │
│ ── User Info ──         │                           │
│ [AV] Nome · Role        │                           │
│ [Sair]                  │                           │
└─────────────────────────────────────────────────────┘
```

**Estado gerenciado pelo ClientLayout:**
- `selectedCarteira` — carteira selecionada (id + nome)
- `carteiras` — lista de carteiras do usuario
- `filters` — { tese, recuperabilidade, uf, periodo }
- `search` — texto de busca
- Passados para `<Outlet />` via `useOutletContext()`

**API calls do layout:**
- `api.get('/carteiras')` — listar carteiras do usuario (na montagem)
- Filtros passados para o componente filho via context

**Fonte e estilo (aplicar apenas dentro do ClientLayout):**
```jsx
<div style={{ fontFamily: "'IBM Plex Sans', sans-serif" }} className="flex h-screen bg-[#f5f6f8]">
```

**Seletor de carteira:**
```jsx
<select
  value={selectedCarteira?.id || ''}
  onChange={e => {
    const cart = carteiras.find(c => c.id === e.target.value);
    setSelectedCarteira(cart);
  }}
  className="w-full rounded-md border border-[#dfe1e5] bg-white px-3 py-2.5 text-sm font-medium"
>
  {carteiras.map(c => (
    <option key={c.id} value={c.id}>{c.nome}</option>
  ))}
</select>
```

## Fase 4: Criar ClientPanel.jsx [complexo]

Pagina principal unica que substitui Dashboard, Carteiras, Casos e Processos do cliente.

### Tarefas

- [x] Criar componente `ClientPanel.jsx` com stats grid + tabela de casos
  - [x] Stats grid: 4 cards (carteira highlight, total casos, processos, valor)
  - [x] Tabela de casos com tabs por tese
  - [x] Paginacao
  - [x] Acoes: download e ver detalhes (abre modal)
- [x] Integrar com filtros recebidos do ClientLayout via `useOutletContext()`
- [x] Buscar dados de stats e casos da API

### Detalhes Tecnicos

**Arquivo**: `frontend/src/pages/client/ClientPanel.jsx`

**Stats — dados via dashboard client:**
```jsx
const { data } = await api.get('/dashboard/client');
// data.data = { total_carteiras, total_casos, total_processos, carteiras: [...] }
```

Para stats da carteira selecionada, filtrar de `data.data.carteiras`:
```jsx
const carteiraStats = stats?.carteiras?.find(c => c.id === selectedCarteira?.id);
// carteiraStats = { id, nome, qtd_casos, qtd_processos, valor_total, ... }
```

**Tabela de casos:**
```jsx
const params = {
  page,
  per_page: 20,
  carteira_id: selectedCarteira?.id,
  ...(activeTab !== 'all' && { tese: activeTab }),
  ...(filters.tese && { tese: filters.tese }),
  ...(filters.recuperabilidade && { recuperabilidade: filters.recuperabilidade }),
  ...(filters.uf && { uf: filters.uf }),
  ...(search && { search }),
};
const { data } = await api.get('/casos', { params });
// data = { data: [...], pagination: { page, per_page, total, total_pages } }
```

**Tabs de tese:**
```jsx
const TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'NPL', label: 'NPL' },
  { key: 'RJ', label: 'RJ' },
  { key: 'Divida_Ativa', label: 'Divida Ativa' },
];
```

**Colunas da tabela:**
| Coluna | Campo | Formato |
|--------|-------|---------|
| Caso / Devedor | `caso.nome` + `caso.devedor` | Texto + subtexto |
| Tese | `caso.tese` | Badge colorido |
| Recuperab. | `caso.recuperabilidade` | Badge colorido |
| Valor | `caso.valor_total` | `formatCurrency()` |
| Processos | count (do caso) | Icone + numero |
| Analise | `caso.data_analise` ou `caso.updated_at` | `formatDate()` |
| Acoes | botoes | Download + Ver |

**Cores dos badges:**
```jsx
const recuperabilidadeColors = {
  Alta: 'bg-[rgba(19,115,51,0.08)] text-[#137333]',
  Potencial: 'bg-[rgba(176,96,0,0.08)] text-[#b06000]',
  Critica: 'bg-[#fff3e0] text-[#e65100]',
  Indefinida: 'bg-[rgba(95,99,104,0.08)] text-[#5f6368]',
  Nenhuma: 'bg-[rgba(197,34,31,0.08)] text-[#c5221f]',
};

const teseColors = {
  NPL: 'bg-[rgba(25,103,210,0.08)] text-[#1967d2]',
  RJ: 'bg-[rgba(25,103,210,0.08)] text-[#1967d2]',
  Divida_Ativa: 'bg-[rgba(25,103,210,0.08)] text-[#1967d2]',
  Litigio: 'bg-[rgba(25,103,210,0.08)] text-[#1967d2]',
};
```

## Fase 5: Criar CaseDetailModal.jsx [complexo]

Modal de detalhes do caso com processos e downloads.

### Tarefas

- [x] Criar modal com overlay, animacao de entrada, fechar com Escape/click fora
- [x] Header com nome do caso e devedor
- [x] Grid de detalhes do caso (6 campos)
- [x] Secao "Relatorio Consolidado do Caso" com download HTML/PDF
- [x] Lista de processos em cards
  - [x] Cada card: CNJ, tipo acao, badge, info grid (4 cols), botoes download
- [x] Implementar handlers de download/preview via axios (corrige bug Token ausente)
- [x] Buscar processos e documentos ao abrir modal

### Detalhes Tecnicos

**Arquivo**: `frontend/src/pages/client/CaseDetailModal.jsx`

**Props:**
```jsx
function CaseDetailModal({ casoId, onClose }) { ... }
```

**Dados carregados ao abrir:**
```jsx
// 1. Detalhes do caso
const { data: casoRes } = await api.get(`/casos/${casoId}`);
const caso = casoRes.data || casoRes;

// 2. Processos do caso
const { data: procRes } = await api.get('/processos', { params: { caso_id: casoId, per_page: 100 } });
const processos = procRes.data || [];

// 3. Documentos de cada processo
for (const proc of processos) {
  const { data: docsRes } = await api.get('/documentos', { params: { processo_id: proc.id } });
  proc.documentos = docsRes.data || [];
  // signed_url ja vem incluido em cada doc (documentos_routes.py:76-81)
}
```

**Download handler (corrige bug "Token ausente"):**
```jsx
const handleDownload = async (docId) => {
  try {
    const { data } = await api.get(`/preview/${docId}`);
    if (data.signed_url) {
      window.open(data.signed_url, '_blank');
    }
  } catch {
    alert('Erro ao baixar documento');
  }
};
```

**Estrutura do modal:**
```
┌─── Modal Header ─────────────────────────────────────┐
│ Nome do Caso                              [X fechar] │
│ Devedor · CNPJ                                       │
├──────────────────────────────────────────────────────┤
│ ┌─ Detalhes ──────────────────────────────────────┐  │
│ │ Credor      │ Tese [badge] │ Recuperab. [badge] │  │
│ │ Valor Total │ UF           │ Data Analise       │  │
│ └─────────────────────────────────────────────────┘  │
│                                                      │
│ ┌─ Relatorio Consolidado ─────────────────────────┐  │
│ │ 📄 Relatorio Consolidado do Caso    [HTML] [PDF]│  │
│ └─────────────────────────────────────────────────┘  │
│                                                      │
│ ── Relatorios por Processo (N) ──                    │
│                                                      │
│ ┌─ Processo Card ─────────────────────────────────┐  │
│ │ CNJ: 1234567-89.2023.8.26.0100     [Alta badge] │  │
│ │ Execucao de Titulo Extrajudicial                 │  │
│ │ ┌──────────┬──────────┬──────────┬────────────┐ │  │
│ │ │Polo Ativo│Polo Pass.│  Valor   │Tribunal/Vara│ │  │
│ │ └──────────┴──────────┴──────────┴────────────┘ │  │
│ │ [HTML] [PDF]                                     │  │
│ └─────────────────────────────────────────────────┘  │
│                                                      │
│ ┌─ Processo Card (Incidental) ────────────────────┐  │
│ │ CNJ: 1234568-89.2023.8.26.0100   [Incidental]   │  │
│ │ ...                                              │  │
│ └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**Estilo do card "Relatorio Consolidado" (gold accent):**
```jsx
<div className="rounded-md border border-[rgba(139,105,20,0.25)] bg-[rgba(139,105,20,0.08)] p-4">
```

**Botoes de download:**
```jsx
<button
  onClick={() => handleDownload(doc.id)}
  className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium
             border border-[#dfe1e5] bg-white text-[#5f6368]
             hover:bg-[#1a365d] hover:border-[#1a365d] hover:text-white transition"
>
  <DownloadIcon className="h-3 w-3" />
  {doc.file_type?.toUpperCase()}
</button>
```

## Fase 6: Ajustar Rotas no App.jsx

Trocar rotas do cliente para usar ClientLayout + ClientPanel.

### Tarefas

- [x] Importar `ClientLayout` e `ClientPanel` no `App.jsx`
- [x] Substituir rotas do cliente (5 rotas → 1 rota dentro de ClientLayout)
- [x] Manter rotas admin intactas

### Detalhes Tecnicos

**Arquivo**: `frontend/src/App.jsx`

**Antes (rotas cliente):**
```jsx
// Dentro do <Route element={<Layout />}>
<Route index element={isAdmin ? <AdminDashboard /> : <ClientDashboard />} />
<Route path="carteiras" element={<ClientCarteirasPage />} />
<Route path="carteiras/:id/casos" element={<ClientCasosPage />} />
<Route path="casos/:id/processos" element={<ClientProcessosPage />} />
<Route path="processos/:id" element={<ClientProcessoDetail />} />
```

**Depois:**
```jsx
// Rotas admin (dentro de <Route element={<Layout />}>)
// ... mantidas como estao

// Rota cliente (Layout separado)
<Route element={<ClientLayout />}>
  <Route index element={<ClientPanel />} />
</Route>
```

A logica de redirecionamento admin/client no `DashboardRedirect.jsx` ou `App.jsx` deve ser ajustada para usar o layout correto baseado no role.

## Fase 7: Remover Paginas Antigas do Cliente

Limpar arquivos obsoletos.

### Tarefas

- [x] Remover `frontend/src/pages/client/ClientDashboard.jsx`
- [x] Remover `frontend/src/pages/client/ClientCarteirasPage.jsx`
- [x] Remover `frontend/src/pages/client/ClientCasosPage.jsx`
- [x] Remover `frontend/src/pages/client/ClientProcessosPage.jsx`
- [x] Remover `frontend/src/pages/client/ClientProcessoDetail.jsx`
- [x] Remover imports destes arquivos no `App.jsx` e em qualquer outro lugar

### Detalhes Tecnicos

Verificar que nenhum outro arquivo importa estes componentes antes de remover:
```bash
grep -r "ClientDashboard\|ClientCarteirasPage\|ClientCasosPage\|ClientProcessosPage\|ClientProcessoDetail" frontend/src/ --include="*.jsx" --include="*.js"
```

## Fase 8: Build e Verificacao

### Tarefas

- [x] Executar `cd frontend && pnpm build` — verificar zero erros
- [x] Executar `cd frontend && pnpm lint` — verificar zero erros
- [x] Verificar area admin inalterada (login admin funciona, ProcessoDetail mostra dados)
