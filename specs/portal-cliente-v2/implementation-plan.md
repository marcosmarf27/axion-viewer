# Plano de Implementacao: Portal do Cliente v2.0

## Visao Geral

Implementar alteracoes de branding, UX e funcionalidades no Portal do Cliente conforme especificacao Axion Viewer 2.0, mantendo a arquitetura existente (React + Flask + Supabase).

---

## Fase 1: Migration do Banco de Dados

Adicionar campo telefone na tabela profiles para permitir edicao de perfil pelo cliente.

### Tarefas

- [x] Executar migration para adicionar coluna `telefone` na tabela `profiles`

### Detalhes Tecnicos

**Migration SQL:**
```sql
-- Migration: add_telefone_to_profiles
ALTER TABLE public.profiles ADD COLUMN telefone text;
COMMENT ON COLUMN public.profiles.telefone IS 'Telefone de contato do usuario';
```

**Executar via MCP Supabase:**
```
mcp__plugin_supabase_supabase__apply_migration
project_id: rvzkszfowlzioddqjryz
name: add_telefone_to_profiles
```

**Estrutura atual da tabela profiles:**
- id (uuid), email (text), full_name (text), role (user_role enum), created_at, updated_at

---

## Fase 2: Backend - Ajustes na API

Adaptar endpoints para suportar filtro de data com intervalo e retornar nome da empresa do cliente.

### Tarefas

- [x] Adicionar parametro `data_analise_ate` no endpoint GET /api/casos
- [x] Incluir `cliente_nome` no retorno de GET /api/dashboard/client
- [x] Adicionar campos ao whitelist ALLOWED_SORT_FIELDS

### Detalhes Tecnicos

**Arquivo:** `routes/casos_routes.py`

Adicionar apos linha 24:
```python
data_analise_ate = request.args.get("data_analise_ate")
```

Modificar extra_query_fn (linhas 56-60):
```python
def build_date_filter(query):
    if data_analise_desde:
        query = query.gte("data_analise", data_analise_desde)
    if data_analise_ate:
        query = query.lte("data_analise", data_analise_ate)
    return query

if data_analise_desde or data_analise_ate:
    extra_query_fn = build_date_filter
```

**Arquivo:** `utils/supabase_client.py`

Adicionar ao ALLOWED_SORT_FIELDS (linha ~11):
```python
ALLOWED_SORT_FIELDS = {
    # ... campos existentes ...
    "data_analise",
    "valor_total",
    "recuperabilidade",
}
```

Modificar `get_client_dashboard_stats` para buscar nome do cliente:
```python
# Buscar nome do cliente (da primeira carteira)
cliente_nome = None
if carteiras and carteiras[0].get("cliente_id"):
    cliente_result = (
        self.client.table("clientes")
        .select("nome")
        .eq("id", carteiras[0]["cliente_id"])
        .single()
        .execute()
    )
    if cliente_result.data:
        cliente_nome = cliente_result.data.get("nome")

# Incluir no retorno
return {
    # ... campos existentes ...
    "cliente_nome": cliente_nome,
}
```

**Fluxo para obter empresa do usuario:**
```
profile.id -> cliente_carteira_access.profile_id
           -> cliente_carteira_access.carteira_id -> carteiras.id
           -> carteiras.cliente_id -> clientes.id -> clientes.nome
```

---

## Fase 3: Tela de Login - Branding

Atualizar textos de branding e adicionar rodape com copyright.

### Tarefas

- [x] Alterar subtitulo "Intelligence" para "Painel do Cliente" na area esquerda
- [x] Adicionar rodape com copyright e CNPJ apos o botao de submit
- [x] Atualizar texto do logo reveal no TypewriterASCII

### Detalhes Tecnicos

**Arquivo:** `frontend/src/pages/LoginPage.jsx`

Alterar linha ~75 (subtitulo):
```jsx
// De: "Intelligence"
// Para:
<span style={{ /* estilos existentes */ }}>
  Painel do Cliente
</span>
```

Adicionar apos o botao de submit (apos linha ~209):
```jsx
{/* Footer do formulario */}
<div className="mt-6 text-center">
  <p style={{
    fontFamily: '"IBM Plex Sans", sans-serif',
    fontSize: '11px',
    color: '#80868b',
    lineHeight: '1.5',
  }}>
    By Axioma Intelligence &copy; 2026 - Todos os direitos reservados.
  </p>
  <p style={{
    fontFamily: '"IBM Plex Sans", sans-serif',
    fontSize: '10px',
    color: '#80868b',
    marginTop: '2px',
  }}>
    CNPJ: 60.328.148/0001-81
  </p>
</div>
```

**Arquivo:** `frontend/src/components/TypewriterASCII.jsx`

Alterar logo reveal (linhas ~289-328) para exibir:
- Titulo: "Axion Viewer 2.0"
- Subtitulo: "Powered by Axioma Intelligence"

```jsx
{/* Brand text - Titulo */}
<div style={{ /* estilos existentes */ }}>
  <span style={{ color: '#ffffff' }}>Axion</span>
  <span style={{ color: '#d4a843', marginLeft: '8px' }}>Viewer</span>
  <span style={{ color: '#d4a843', marginLeft: '8px', fontSize: '16px' }}>2.0</span>
</div>

{/* Subtitle - Powered by */}
<div style={{
  marginTop: '8px',
  fontFamily: '"IBM Plex Mono", monospace',
  fontSize: '11px',
  color: '#80868b',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}}>
  Powered by Axioma Intelligence
</div>
```

---

## Fase 4: Sidebar do Cliente [complexo]

Implementar novos filtros, tags de filtros aplicados, area do usuario com empresa, e modal de edicao de perfil.

### Tarefas

- [x] Substituir icone SVG do logo por img com logo.png
- [x] Converter filtro de data unico para dois campos (Data Inicial / Data Final)
- [x] Adicionar componente de tags de filtros aplicados com remocao individual
- [x] Atualizar area do usuario: nome (bold) + empresa + icone engrenagem
- [x] Criar componente ProfileEditModal.jsx [complexo]
  - [x] Campos: email (read-only), telefone, senha, confirmar senha
  - [x] Validacao de senha (min 6 chars, confirmacao igual)
  - [x] Integracao com Supabase Auth para troca de senha

### Detalhes Tecnicos

**Arquivo:** `frontend/src/components/ClientLayout.jsx`

**4.1 Icone do logo (linhas 82-97):**
```jsx
<img
  src="/logo.png"
  alt="Axion Viewer"
  className="h-9 w-9 rounded-lg"
/>
```

**4.2 Filtro de data - atualizar FILTER_DEFAULTS (linha 6):**
```jsx
const FILTER_DEFAULTS = {
  tese: '',
  recuperabilidade: '',
  uf: '',
  periodoInicio: '',
  periodoFim: ''
};
```

**4.2 Dois inputs de data (substituir linhas 202-208):**
```jsx
<div className="space-y-2">
  <label className="block text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
    Data Inicial
  </label>
  <input
    type="date"
    value={filters.periodoInicio}
    onChange={e => setFilters(f => ({ ...f, periodoInicio: e.target.value }))}
    className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
  />
</div>
<div className="space-y-2">
  <label className="block text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
    Data Final
  </label>
  <input
    type="date"
    value={filters.periodoFim}
    min={filters.periodoInicio}
    onChange={e => setFilters(f => ({ ...f, periodoFim: e.target.value }))}
    className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
  />
</div>
```

**4.3 Tags de filtros (adicionar apos linha 224):**
```jsx
{(appliedFilters.tese || appliedFilters.recuperabilidade || appliedFilters.uf ||
  appliedFilters.periodoInicio || appliedFilters.periodoFim) && (
  <div className="mt-4 flex flex-wrap gap-2">
    {appliedFilters.tese && (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--color-accent)]">
        Tese: {appliedFilters.tese}
        <button onClick={() => {
          setAppliedFilters(f => ({ ...f, tese: '' }));
          setFilters(f => ({ ...f, tese: '' }));
        }} className="ml-1 hover:text-red-500">&times;</button>
      </span>
    )}
    {/* Repetir para recuperabilidade, uf, periodo */}
  </div>
)}
```

**4.4 Area do usuario - adicionar estado para clienteNome:**
```jsx
const [clienteNome, setClienteNome] = useState(null);

// No useEffect que busca dashboard:
useEffect(() => {
  if (dashboardData?.cliente_nome) {
    setClienteNome(dashboardData.cliente_nome);
  }
}, [dashboardData]);
```

**4.5 Footer do usuario (linhas 228-263):**
```jsx
<div className="border-t border-[var(--color-border-subtle)] px-4 py-4">
  <div className="flex items-center gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-semibold text-white">
      {initials}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-[var(--color-text)]">
        {profile?.full_name || profile?.email}
      </p>
      <p className="text-[11px] text-[var(--color-text-subtle)]">
        {clienteNome || 'Cliente'}
      </p>
    </div>
    <button onClick={() => setShowProfileModal(true)} title="Editar perfil">
      {/* Icone engrenagem SVG */}
    </button>
    <button onClick={() => { signOut(); navigate('/login'); }} title="Sair">
      {/* Icone logout SVG */}
    </button>
  </div>
</div>
```

**Arquivo novo:** `frontend/src/components/ProfileEditModal.jsx`

```jsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function ProfileEditModal({ isOpen, onClose }) {
  const { profile, user } = useAuth();
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile?.telefone) setTelefone(profile.telefone);
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (senha && senha !== confirmSenha) {
      setError('As senhas nao coincidem');
      return;
    }
    if (senha && senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      // Atualizar telefone
      await supabase.from('profiles')
        .update({ telefone, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      // Atualizar senha se informada
      if (senha) {
        await supabase.auth.updateUser({ password: senha });
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  // ... JSX do modal
}
```

**Adicionar em ClientLayout.jsx:**
```jsx
import ProfileEditModal from '@/components/ProfileEditModal';
// ...
const [showProfileModal, setShowProfileModal] = useState(false);
// ...
<ProfileEditModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
```

---

## Fase 5: Tabela de Casos

Implementar clique na linha, botao de download, e ordenacao por colunas.

### Tarefas

- [x] Tornar toda a linha da tabela clicavel (abre modal)
- [x] Adicionar botao de download ao lado do botao "Ver"
- [x] Implementar ordenacao por colunas com indicador visual
- [x] Exibir "Varias" no card carteira quando aba "Todos" com multiplas carteiras

### Detalhes Tecnicos

**Arquivo:** `frontend/src/pages/client/ClientPanel.jsx`

**5.1 Linha clicavel (linha ~287):**
```jsx
<tr
  key={caso.id}
  className="cursor-pointer transition hover:bg-[var(--color-accent-subtle)]"
  onClick={() => setSelectedCasoId(caso.id)}
>
```

**Parar propagacao na celula de acoes:**
```jsx
<td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
```

**5.2 Botao de download - adicionar estado e funcao:**
```jsx
const [downloadingCasoId, setDownloadingCasoId] = useState(null);

const handleQuickDownload = async (e, casoId) => {
  e.stopPropagation();
  setDownloadingCasoId(casoId);
  try {
    // Buscar primeiro documento do caso
    const { data: procRes } = await api.get('/processos', {
      params: { caso_id: casoId, per_page: 1 }
    });
    const proc = procRes.data?.[0];
    if (!proc) { alert('Nenhum documento encontrado'); return; }

    const { data: docsRes } = await api.get('/documentos', {
      params: { processo_id: proc.id, per_page: 1 }
    });
    const doc = docsRes.data?.[0];
    if (!doc) { alert('Nenhum documento encontrado'); return; }

    const { data } = await api.get(`/preview/${doc.id}`, {
      params: { download: 'true' }
    });
    if (data.signed_url) window.open(data.signed_url, '_blank');
  } finally {
    setDownloadingCasoId(null);
  }
};
```

**5.3 Ordenacao - estados e funcao:**
```jsx
const [sortField, setSortField] = useState('data_analise');
const [sortOrder, setSortOrder] = useState('desc');

const handleSort = (field) => {
  if (sortField === field) {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  } else {
    setSortField(field);
    setSortOrder('desc');
  }
};

// Componente header ordenavel
function SortableHeader({ field, label, currentSort, currentOrder, onSort }) {
  const isActive = currentSort === field;
  return (
    <th
      className="cursor-pointer hover:text-[var(--color-text)] select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (currentOrder === 'asc' ? '▲' : '▼')}
      </div>
    </th>
  );
}
```

**Incluir sort nos params da API:**
```jsx
const params = {
  page,
  per_page: 20,
  sort_field: sortField,
  sort_order: sortOrder,
  // ... resto
};
```

**Logica de ordenacao para Recuperabilidade:**
- Alta (1) > Potencial (2) > Critica (3) > Indefinida (4) > Nenhuma (5)

**Nota:** A ordenacao por recuperabilidade usa ordem alfabetica no banco (Alta < Critica < Potencial).
Para ordem semantica correta, adicionar campo `recuperabilidade_ordem` na tabela ou tratar no frontend:
```javascript
const RECUPERABILIDADE_ORDER = { 'Alta': 1, 'Potencial': 2, 'Critica': 3, 'Indefinida': 4, 'Nenhuma': 5 };
// Ordenar localmente apos fetch se campo for recuperabilidade
```

**5.4 Card carteira "Varias" (linha ~128):**
```jsx
const { selectedCarteira, filters, search, carteiras } = useOutletContext();

<StatCard
  label="Carteira"
  value={activeTab === 'all' && carteiras?.length > 1 ? 'Varias' : selectedCarteira?.nome || '-'}
  highlight
/>
```

---

## Fase 6: Modal Detalhes do Caso

Implementar secao de relatorio destacada, botoes HTML/PDF, polo passivo com tooltip, e label valor ajuizado.

### Tarefas

- [x] Renomear secao para "Relatorio do Caso" com destaque visual dourado
- [x] Implementar botoes Ver/Baixar para HTML e PDF com estados esmaecidos
- [x] Criar funcao formatPoloPassivo com tooltip para multiplos nomes
- [x] Alterar label "Valor Total" para "VALOR AJUIZADO"

### Detalhes Tecnicos

**Arquivo:** `frontend/src/pages/client/CaseDetailModal.jsx`

**6.1 Secao Relatorio do Caso (substituir linhas ~355-414):**
```jsx
{allDocs.length > 0 && (
  <div className="mb-6 rounded-lg border-2 border-[var(--color-accent-gold)] bg-[rgba(139,105,20,0.06)] p-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <svg className="h-6 w-6 text-[var(--color-accent-gold)]">
          {/* icone documento */}
        </svg>
        <span className="text-base font-bold text-[var(--color-accent-gold)]">
          Relatorio do Caso
        </span>
      </div>
      <div className="flex gap-2">
        {(() => {
          const htmlDoc = allDocs.find(d => d.file_type === 'html');
          const pdfDoc = allDocs.find(d => d.file_type === 'pdf');
          return (
            <>
              {/* Botoes HTML: Ver + Baixar */}
              <div className="flex gap-1">
                <button
                  onClick={() => htmlDoc && handlePreview(htmlDoc)}
                  disabled={!htmlDoc}
                  title={htmlDoc ? 'Ver HTML' : 'HTML nao disponivel'}
                  className={htmlDoc
                    ? 'bg-accent text-white'
                    : 'opacity-50 cursor-not-allowed'}
                >
                  Ver HTML
                </button>
                <button
                  onClick={() => htmlDoc && handleDownload(htmlDoc.id)}
                  disabled={!htmlDoc}
                  title={htmlDoc ? 'Baixar HTML' : 'HTML nao disponivel'}
                  className={htmlDoc ? '' : 'opacity-50 cursor-not-allowed'}
                >
                  Baixar
                </button>
              </div>
              {/* Botoes PDF: Ver + Baixar */}
              <div className="flex gap-1">
                {/* Mesma estrutura para PDF */}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  </div>
)}
```

**6.2 Funcao formatPoloPassivo:**
```jsx
function formatPoloPassivo(poloPassivo) {
  if (!poloPassivo) return '-';
  const partes = poloPassivo.split(';').map(p => p.trim()).filter(Boolean);
  if (partes.length === 1) return partes[0];

  const primeiro = partes[0];
  const outros = partes.length - 1;

  return (
    <span className="group relative">
      {primeiro}{' '}
      <span className="text-[var(--color-text-muted)]">
        + {outros} outro{outros > 1 ? 's' : ''}
      </span>
      <span className="absolute left-0 top-full z-10 mt-1 hidden w-64 rounded-md border bg-white p-2 text-xs shadow-lg group-hover:block">
        {partes.map((p, i) => (
          <div key={i} className="py-0.5">{p}</div>
        ))}
      </span>
    </span>
  );
}
```

**Uso (linha ~470):**
```jsx
<p className="mt-0.5 text-xs text-[var(--color-text)]">
  {formatPoloPassivo(proc.polo_passivo)}
</p>
```

**6.3 Label valor (linha ~347):**
```jsx
<DetailField label="Valor Ajuizado" value={formatCurrency(caso.valor_total)} />
```

---

## Arquivos Modificados

```
# Backend
routes/casos_routes.py
utils/supabase_client.py

# Frontend
frontend/src/pages/LoginPage.jsx
frontend/src/components/TypewriterASCII.jsx
frontend/src/components/ClientLayout.jsx
frontend/src/components/ProfileEditModal.jsx (NOVO)
frontend/src/pages/client/ClientPanel.jsx
frontend/src/pages/client/CaseDetailModal.jsx
```

---

## Verificacao

1. **Migration**: Confirmar coluna telefone em profiles via Supabase dashboard
2. **Login**: Verificar textos branding e rodape
3. **Sidebar**: Testar filtros com range de data, remocao de tags, edicao de perfil
4. **Tabela**: Clicar na linha, baixar documento, ordenar colunas
5. **Modal**: Ver/baixar HTML e PDF, hover no polo passivo, label "VALOR AJUIZADO"
6. **Producao**: Deploy e testar em `https://axion-viewer-production.up.railway.app`
