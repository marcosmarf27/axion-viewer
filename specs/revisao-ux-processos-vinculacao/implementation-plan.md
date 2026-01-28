# Plano de Implementacao: Revisao UX - Processos, Vinculacao e Tour Guiado

## Visao Geral

Melhorar a UX dos fluxos de processos e vinculacao com: componente SearchableSelect reutilizavel, icones claros via lucide-react, formulario de processos organizado em secoes, e tour guiado com opcao de desativar permanentemente.

---

## Fase 1: Instalar lucide-react e criar componente SearchableSelect

Criar a base reutilizavel que sera aplicada nas fases seguintes.

### Tarefas

- [x] Instalar `lucide-react` via pnpm
- [x] Criar componente `SearchableSelect.jsx` [complexo]
  - [x] Input com icone de busca e chevron open/close
  - [x] Dropdown com lista filtrada posicionado `absolute`
  - [x] Filtragem local case-insensitive por `searchTerm`
  - [x] Navegacao por teclado (ArrowUp/Down, Enter, Escape)
  - [x] Click fora fecha dropdown (event listener no `document`)
  - [x] Prop `renderOption` para layout customizado de cada opcao
  - [x] Exibir label do item selecionado quando dropdown fechado
  - [x] Estados: disabled, required, empty message

### Detalhes Tecnicos

**Instalacao:**
```bash
cd frontend && pnpm add lucide-react
```

**Arquivo a criar:** `frontend/src/components/SearchableSelect.jsx`

**API do componente:**
```jsx
<SearchableSelect
  value={form.caso_id}                    // valor selecionado
  onChange={(value) => set('caso_id', value)} // callback
  options={casos}                         // array de objetos
  valueKey="id"                           // chave do valor
  labelKey="nome"                         // chave do label
  placeholder="Selecione um caso"         // placeholder fechado
  searchPlaceholder="Buscar caso..."      // placeholder do input
  emptyMessage="Nenhum caso encontrado"   // mensagem quando vazio
  disabled={false}                        // desabilitado
  required={true}                         // obrigatorio
  renderOption={(option) => (             // render customizado (opcional)
    <div>
      <span className="font-medium">{option.nome}</span>
      <span className="text-xs text-slate-400 ml-2">{option.cliente_nome}</span>
    </div>
  )}
/>
```

**Classe CSS base (compativel com inputClass existente):**
```javascript
const inputClass = 'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
```

**Dropdown style:**
```
absolute left-0 right-0 top-full mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg z-50
```

**Opcao selecionada:** `bg-indigo-50 text-indigo-700`
**Opcao hover/highlighted:** `bg-slate-50`

**Refs necessarios:** `containerRef` (click outside), `inputRef` (focus), `listRef` (scroll into view)

**Icones lucide usados:** `Search`, `ChevronDown`, `ChevronUp`, `X` (limpar selecao)

---

## Fase 2: Aplicar SearchableSelect nos formularios de vinculacao

Substituir todos os `<select>` nativos nos fluxos de vinculacao.

### Tarefas

- [x] Substituir select de **caso_id** no ProcessoFormModal por SearchableSelect
- [x] Substituir select de **processo_pai_id** no ProcessoFormModal por SearchableSelect
- [x] Substituir select de **processo** no VincularModal (DocumentosPage) por SearchableSelect
- [x] Adicionar campo de busca de texto no VincularDocumentoModal (ProcessoDetail)
- [x] Adicionar contador de documentos no VincularDocumentoModal

### Detalhes Tecnicos

**Arquivo:** `frontend/src/pages/admin/ProcessosPage.jsx`

Campo caso_id (linhas 210-223) — substituir `<select>` por:
```jsx
<SearchableSelect
  value={form.caso_id}
  onChange={(v) => set('caso_id', v)}
  options={casos}
  valueKey="id"
  labelKey="nome"
  placeholder="Selecione um caso"
  searchPlaceholder="Buscar caso..."
  required
  renderOption={(c) => (
    <div className="flex justify-between">
      <span className="font-medium">{c.nome}</span>
      {c.cliente_nome && <span className="text-xs text-slate-400">{c.cliente_nome}</span>}
    </div>
  )}
/>
```

Campo processo_pai_id (linhas 228-240) — substituir `<select>` por:
```jsx
<SearchableSelect
  value={form.processo_pai_id}
  onChange={(v) => set('processo_pai_id', v)}
  options={processosDoCase}
  valueKey="id"
  labelKey="numero_cnj"
  placeholder="Nenhum (processo principal)"
  searchPlaceholder="Buscar processo..."
  disabled={!form.caso_id}
  renderOption={(p) => (
    <div>
      <span className="font-medium">{p.numero_cnj}</span>
      {p.tipo_acao && <span className="ml-2 text-xs text-slate-400">{p.tipo_acao}</span>}
    </div>
  )}
/>
```

**Arquivo:** `frontend/src/pages/admin/DocumentosPage.jsx`

VincularModal (linhas 80-92) — substituir `<select>` por:
```jsx
<SearchableSelect
  value={selectedProcessoId}
  onChange={setSelectedProcessoId}
  options={processos}
  valueKey="id"
  labelKey="numero_cnj"
  placeholder="Selecione um processo..."
  searchPlaceholder="Buscar por numero CNJ..."
  renderOption={(p) => (
    <div>
      <span className="font-medium">{p.numero_cnj}</span>
      {p.caso_nome && <span className="ml-2 text-xs text-slate-400">{p.caso_nome}</span>}
    </div>
  )}
/>
```

**Arquivo:** `frontend/src/pages/admin/ProcessoDetail.jsx`

VincularDocumentoModal (linhas 106-141) — adicionar busca acima da lista:
```jsx
// Novo estado
const [searchTerm, setSearchTerm] = useState('');

// Input de busca (acima da lista, abaixo do titulo)
<div className="mb-3">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      type="text"
      placeholder="Buscar documento por nome ou tipo..."
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
      className="block w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm..."
    />
  </div>
  <p className="mt-1 text-xs text-slate-400">{filtered.length} documento(s) disponivel(is)</p>
</div>

// Filtro
const filtered = documentos.filter(doc => {
  const term = searchTerm.toLowerCase();
  const name = (doc.title || doc.filename || '').toLowerCase();
  const type = (doc.file_type || '').toLowerCase();
  return name.includes(term) || type.includes(term);
});
```

---

## Fase 3: Melhorar icones de acao com lucide-react

Substituir SVGs inline por icones semanticos do lucide-react.

### Tarefas

- [x] Substituir SVGs da tabela de acoes em DocumentosPage por icones lucide
- [x] Adicionar icone `Link2` no botao "Vincular Documento" em ProcessoDetail
- [x] Adicionar icone `Link2` no header do VincularDocumentoModal
- [x] Migrar iconMap do Layout.jsx para lucide-react [complexo]
  - [x] Substituir 11 SVGs inline (~170 linhas) por componentes lucide (~15 linhas)
  - [x] Substituir SVG do botao "Tour Guiado" no sidebar footer

### Detalhes Tecnicos

**Arquivo:** `frontend/src/pages/admin/DocumentosPage.jsx`

Imports a adicionar:
```jsx
import { Eye, Download, Link2, Trash2 } from 'lucide-react';
```

Substituicoes na tabela de acoes (linhas 458-504):
```jsx
// Preview (linha 463-466 SVG → Eye)
<Eye className="h-[18px] w-[18px]" />

// Download (linha 475-476 SVG → Download)
<Download className="h-[18px] w-[18px]" />

// Vincular (linha 486-488 SVG → Link2)
<Link2 className="h-[18px] w-[18px]" />

// Excluir (linha 497-498 SVG → Trash2)
<Trash2 className="h-[18px] w-[18px]" />
```

**Arquivo:** `frontend/src/pages/admin/ProcessoDetail.jsx`

Botao "Vincular Documento" (aproximadamente linha 351):
```jsx
import { Link2, Eye, Download, FileText, FileIcon } from 'lucide-react';

// No botao
<button ...>
  <Link2 className="h-4 w-4" />
  Vincular Documento
</button>
```

Header do VincularDocumentoModal (linha 106):
```jsx
<h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
  <Link2 className="h-5 w-5 text-indigo-600" />
  Vincular Documento
</h2>
```

**Arquivo:** `frontend/src/components/Layout.jsx`

Imports a adicionar:
```jsx
import {
  LayoutDashboard, Users, Briefcase, FolderOpen, Scale,
  FileText, FileUp, Palette, UserCog, Share2, BookOpen, HelpCircle
} from 'lucide-react';
```

Refatorar iconMap (linhas 64-230, ~170 linhas de SVG inline):
```jsx
const iconMap = {
  LayoutDashboard: <LayoutDashboard className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  Briefcase: <Briefcase className="h-5 w-5" />,
  FolderOpen: <FolderOpen className="h-5 w-5" />,
  Scale: <Scale className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  FileOutput: <FileUp className="h-5 w-5" />,
  Palette: <Palette className="h-5 w-5" />,
  UserCog: <UserCog className="h-5 w-5" />,
  Share2: <Share2 className="h-5 w-5" />,
  BookOpen: <BookOpen className="h-5 w-5" />,
};
```

Botao "Tour Guiado" no sidebar footer (linhas 392-404 SVG → HelpCircle):
```jsx
<HelpCircle className="h-4 w-4" />
```

---

## Fase 4: Reorganizar formulario de processos em secoes

Agrupar os 22+ campos do ProcessoFormModal em secoes logicas com headers visuais.

### Tarefas

- [x] Criar componente auxiliar `FormSection` (inline no ProcessosPage)
- [x] Reorganizar campos em 7 secoes logicas
- [x] Ajustar spacing do formulario (`space-y-6`)
- [x] Observacoes como secao full-width

### Detalhes Tecnicos

**Arquivo:** `frontend/src/pages/admin/ProcessosPage.jsx`

Componente auxiliar (definir antes do ProcessoFormModal):
```jsx
function FormSection({ title, children, fullWidth = false }) {
  return (
    <div>
      <h3 className="mb-3 border-b border-slate-100 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h3>
      <div className={fullWidth ? 'space-y-4' : 'grid grid-cols-1 gap-4 sm:grid-cols-2'}>
        {children}
      </div>
    </div>
  );
}
```

Organizacao das secoes:
```
<form className="space-y-6">
  <FormSection title="Identificacao">
    - Numero CNJ *
    - Tipo de Acao
    - Incidental (checkbox, usando flex items-end)
  </FormSection>

  <FormSection title="Relacionamentos">
    - Caso * (SearchableSelect)
    - Processo Pai (SearchableSelect, disabled se caso vazio)
  </FormSection>

  <FormSection title="Classificacao">
    - Tipo de Tese
    - Recuperabilidade
    - Status
  </FormSection>

  <FormSection title="Dados Judiciais">
    - Polo Ativo
    - Polo Passivo
    - Comarca
    - Vara
    - Tribunal
    - UF
    - Fase Processual
  </FormSection>

  <FormSection title="Valores">
    - Valor da Causa
    - Valor da Divida
    - Valor Atualizado
  </FormSection>

  <FormSection title="Movimentacao">
    - Data Distribuicao
    - Ultima Movimentacao
    - Data Ult. Movimentacao
  </FormSection>

  <FormSection title="Observacoes" fullWidth>
    - Textarea (rows=3, full width)
  </FormSection>

  {/* Botoes: Cancelar | Criar/Salvar */}
</form>
```

O `<form>` principal muda de `space-y-4` para `space-y-6`.
O container do modal mantem `max-w-2xl` e `max-h-[90vh] overflow-y-auto`.

---

## Fase 5: Tour guiado — opcao de desativar permanentemente

Adicionar estado `hidden` que esconde completamente o tour (card + sidebar).

### Tarefas

- [x] Adicionar estado `hidden` e funcoes `hideTour`/`showTour` no TourContext
- [x] Persistir `hidden` no localStorage
- [x] TourProgressCard: retornar `null` se `hidden === true`
- [x] TourProgressCard: adicionar botao "Nao mostrar novamente" (`hideTour`)
- [x] Layout.jsx: esconder botao "Tour Guiado" quando `hidden === true`
- [x] Layout.jsx: exibir botao discreto `?` para reativar quando hidden
- [x] AdminDashboard.jsx: verificar `hidden` no auto-start

### Detalhes Tecnicos

**Arquivo:** `frontend/src/contexts/TourContext.jsx`

Adicionar estado `hidden`:
```jsx
const [hidden, setHidden] = useState(() => {
  const saved = loadState();
  return saved?.hidden || false;
});

// Persistir junto com os demais
useEffect(() => {
  saveState({ dismissed, completedSteps, hidden });
}, [dismissed, completedSteps, hidden]);

const hideTour = useCallback(() => {
  setIsActive(false);
  setHidden(true);
}, []);

const showTour = useCallback(() => {
  setHidden(false);
  setDismissed(false);
}, []);

// shouldAutoStart considera hidden
const shouldAutoStart = useMemo(
  () => !dismissed && !hidden && completedSteps.length === 0,
  [dismissed, hidden, completedSteps]
);

// Expor no value
const value = useMemo(() => ({
  ...existentes,
  hidden,
  hideTour,
  showTour,
}), [...deps, hidden, hideTour, showTour]);
```

**Arquivo:** `frontend/src/components/tour/TourProgressCard.jsx`

```jsx
const { hidden, hideTour, ...rest } = useTour();

// Early return se hidden
if (hidden) return null;

// No card dismissed (linhas 23-33), adicionar botao:
if (dismissed) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
      <button onClick={resetTour} className="text-sm text-indigo-600 hover:text-indigo-700">
        Reexibir tour de configuracao
      </button>
      <button onClick={hideTour} className="text-xs text-slate-400 hover:text-slate-600">
        Nao mostrar novamente
      </button>
    </div>
  );
}

// No card principal, manter "Ocultar" (skipTour) e adicionar "Nao mostrar novamente" (hideTour)
// No header do card (linha 50-57):
{!allDone && (
  <div className="flex items-center gap-2">
    <button onClick={hideTour} className="text-xs text-slate-400 hover:text-slate-600">
      Nao mostrar novamente
    </button>
    <button onClick={skipTour} className="text-xs text-slate-400 hover:text-slate-600">
      Ocultar
    </button>
  </div>
)}
```

**Arquivo:** `frontend/src/components/Layout.jsx`

Sidebar footer (linhas 384-407):
```jsx
const { startTour, hidden: tourHidden, showTour } = useTour();
const [showReactivate, setShowReactivate] = useState(false);

{profile?.role === 'admin' && (
  tourHidden ? (
    <div className="relative mb-2">
      <button
        onClick={() => setShowReactivate(!showReactivate)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
        title="Tour guiado desativado"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {showReactivate && (
        <div className="absolute bottom-full left-0 mb-2 w-48 rounded-lg border border-slate-700 bg-slate-800 p-3 shadow-lg">
          <p className="mb-2 text-xs text-slate-300">Tour guiado esta desativado.</p>
          <div className="flex gap-2">
            <button onClick={() => { showTour(); setShowReactivate(false); }}
                    className="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700">
              Reativar
            </button>
            <button onClick={() => setShowReactivate(false)}
                    className="rounded px-2 py-1 text-xs text-slate-400 hover:text-slate-200">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  ) : (
    <button onClick={() => { setSidebarOpen(false); startTour(); }} className="...existente...">
      <HelpCircle className="h-4 w-4" />
      Tour Guiado
    </button>
  )
)}
```

**Arquivo:** `frontend/src/pages/admin/AdminDashboard.jsx`

No useEffect de auto-start:
```jsx
const { updateProgressFromStats, shouldAutoStart, startTour, hidden } = useTour();

useEffect(() => {
  if (!loading && shouldAutoStart && !hidden && !autoStarted.current) {
    autoStarted.current = true;
    const timer = setTimeout(() => startTour(), 500);
    return () => clearTimeout(timer);
  }
}, [loading, shouldAutoStart, hidden, startTour]);
```

---

## Ordem de Execucao e Dependencias

```
Fase 1 (SearchableSelect + lucide) ──> Fase 2 (Aplicar nos forms)
                                   ──> Fase 3 (Icones)
                                   ──> Fase 4 (Secoes do form, usa SearchableSelect)
Fase 5 (Tour) ── independente, pode ser feita em paralelo
```

**Ordem recomendada:** Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5

---

## Arquivos Impactados

| Arquivo | Acao | Fases |
|---------|------|-------|
| `frontend/src/components/SearchableSelect.jsx` | CRIAR | 1 |
| `frontend/src/pages/admin/ProcessosPage.jsx` | MODIFICAR | 2, 4 |
| `frontend/src/pages/admin/DocumentosPage.jsx` | MODIFICAR | 2, 3 |
| `frontend/src/pages/admin/ProcessoDetail.jsx` | MODIFICAR | 2, 3 |
| `frontend/src/components/Layout.jsx` | MODIFICAR | 3, 5 |
| `frontend/src/contexts/TourContext.jsx` | MODIFICAR | 5 |
| `frontend/src/components/tour/TourProgressCard.jsx` | MODIFICAR | 5 |
| `frontend/src/pages/admin/AdminDashboard.jsx` | MODIFICAR | 5 |

---

## Verificacao

1. `cd frontend && pnpm build` — build sem erros
2. `cd frontend && pnpm lint` — sem warnings novos
3. Testes manuais em producao (`https://axion-viewer-production.up.railway.app`):
   - Criar/editar processo: SearchableSelect de caso e processo pai funciona com busca
   - Vincular documento a processo: SearchableSelect no modal funciona
   - Vincular documento no ProcessoDetail: busca por texto funciona
   - Icones claros e consistentes (Link2, Eye, Download, Trash2)
   - Formulario de processos organizado em 7 secoes
   - Tour: clicar "Nao mostrar novamente" esconde card + botao sidebar
   - Tour: botao `?` na sidebar permite reativar
