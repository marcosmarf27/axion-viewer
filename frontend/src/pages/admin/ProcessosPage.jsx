import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';

const inputClass =
  'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

const TIPO_TESE_OPTIONS = ['NPL', 'RJ', 'Divida_Ativa', 'Litigio'];
const RECUPERABILIDADE_OPTIONS = ['Alta', 'Potencial', 'Critica', 'Indefinida', 'Nenhuma'];
const STATUS_OPTIONS = ['ativo', 'suspenso', 'arquivado', 'encerrado'];

const emptyForm = {
  numero_cnj: '',
  caso_id: '',
  processo_pai_id: '',
  tipo_tese: '',
  tipo_acao: '',
  is_incidental: false,
  recuperabilidade: '',
  valor_causa: '',
  valor_divida: '',
  valor_atualizado: '',
  polo_ativo: '',
  polo_passivo: '',
  comarca: '',
  vara: '',
  tribunal: '',
  uf: '',
  fase_processual: '',
  data_distribuicao: '',
  ultima_movimentacao: '',
  data_ultima_movimentacao: '',
  observacoes: '',
  status: 'ativo',
};

const recuperabilidadeBadge = value => {
  switch (value) {
    case 'Alta':
      return 'bg-green-100 text-green-700';
    case 'Potencial':
      return 'bg-indigo-100 text-indigo-700';
    case 'Critica':
      return 'bg-red-100 text-red-700';
    case 'Indefinida':
      return 'bg-slate-100 text-slate-600';
    case 'Nenhuma':
      return 'bg-slate-200 text-slate-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
};

const statusBadge = value => {
  switch (value) {
    case 'ativo':
      return 'bg-green-100 text-green-700';
    case 'suspenso':
      return 'bg-yellow-100 text-yellow-700';
    case 'arquivado':
      return 'bg-slate-100 text-slate-600';
    case 'encerrado':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
};

function ProcessoFormModal({ open, editing, onSave, onClose, defaultCasoId }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [casos, setCasos] = useState([]);
  const [processosDoCase, setProcessosDoCase] = useState([]);

  useEffect(() => {
    if (!open) return;
    api
      .get('/casos', { params: { per_page: 100 } })
      .then(res => setCasos(res.data.data || []))
      .catch(() => setCasos([]));
  }, [open]);

  useEffect(() => {
    if (editing) {
      setForm({
        numero_cnj: editing.numero_cnj || '',
        caso_id: editing.caso_id || '',
        processo_pai_id: editing.processo_pai_id || '',
        tipo_tese: editing.tipo_tese || '',
        tipo_acao: editing.tipo_acao || '',
        is_incidental: editing.is_incidental || false,
        recuperabilidade: editing.recuperabilidade || '',
        valor_causa: editing.valor_causa ?? '',
        valor_divida: editing.valor_divida ?? '',
        valor_atualizado: editing.valor_atualizado ?? '',
        polo_ativo: editing.polo_ativo || '',
        polo_passivo: editing.polo_passivo || '',
        comarca: editing.comarca || '',
        vara: editing.vara || '',
        tribunal: editing.tribunal || '',
        uf: editing.uf || '',
        fase_processual: editing.fase_processual || '',
        data_distribuicao: editing.data_distribuicao || '',
        ultima_movimentacao: editing.ultima_movimentacao || '',
        data_ultima_movimentacao: editing.data_ultima_movimentacao || '',
        observacoes: editing.observacoes || '',
        status: editing.status || 'ativo',
      });
    } else {
      setForm({ ...emptyForm, caso_id: defaultCasoId || '' });
    }
    setError(null);
  }, [editing, open, defaultCasoId]);

  // Carrega processos do mesmo caso para selecionar processo_pai_id
  useEffect(() => {
    if (!form.caso_id) {
      setProcessosDoCase([]);
      return;
    }
    api
      .get('/processos', { params: { caso_id: form.caso_id, per_page: 100 } })
      .then(res => {
        let list = res.data.data || [];
        // Ao editar, exclui o proprio processo da lista
        if (editing?.id) {
          list = list.filter(p => p.id !== editing.id);
        }
        setProcessosDoCase(list);
      })
      .catch(() => setProcessosDoCase([]));
  }, [form.caso_id, editing]);

  if (!open) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.numero_cnj.trim()) {
      setError('Numero CNJ e obrigatorio');
      return;
    }
    if (!form.caso_id) {
      setError('Caso e obrigatorio');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        caso_id: form.caso_id || null,
        processo_pai_id: form.processo_pai_id || null,
        tipo_tese: form.tipo_tese || null,
        recuperabilidade: form.recuperabilidade || null,
        valor_causa: form.valor_causa !== '' ? Number(form.valor_causa) : null,
        valor_divida: form.valor_divida !== '' ? Number(form.valor_divida) : null,
        valor_atualizado: form.valor_atualizado !== '' ? Number(form.valor_atualizado) : null,
        data_distribuicao: form.data_distribuicao || null,
        data_ultima_movimentacao: form.data_ultima_movimentacao || null,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {editing ? 'Editar Processo' : 'Novo Processo'}
        </h2>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* numero_cnj */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Numero CNJ *</label>
              <input
                type="text"
                value={form.numero_cnj}
                onChange={e => set('numero_cnj', e.target.value)}
                className={inputClass}
                required
              />
            </div>

            {/* caso_id */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Caso *</label>
              <select
                value={form.caso_id}
                onChange={e => set('caso_id', e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Selecione um caso</option>
                {casos.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* processo_pai_id */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Processo Pai</label>
              <select
                value={form.processo_pai_id}
                onChange={e => set('processo_pai_id', e.target.value)}
                className={inputClass}
                disabled={!form.caso_id}
              >
                <option value="">Nenhum (processo principal)</option>
                {processosDoCase.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.numero_cnj}
                  </option>
                ))}
              </select>
            </div>

            {/* tipo_tese */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Tipo de Tese</label>
              <select
                value={form.tipo_tese}
                onChange={e => set('tipo_tese', e.target.value)}
                className={inputClass}
              >
                <option value="">Nenhum</option>
                {TIPO_TESE_OPTIONS.map(t => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* tipo_acao */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Tipo de Acao</label>
              <input
                type="text"
                value={form.tipo_acao}
                onChange={e => set('tipo_acao', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* is_incidental */}
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_incidental}
                  onChange={e => set('is_incidental', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Incidental
              </label>
            </div>

            {/* recuperabilidade */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Recuperabilidade</label>
              <select
                value={form.recuperabilidade}
                onChange={e => set('recuperabilidade', e.target.value)}
                className={inputClass}
              >
                <option value="">Nenhuma</option>
                {RECUPERABILIDADE_OPTIONS.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* status */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* valor_causa */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Valor da Causa</label>
              <input
                type="number"
                step="0.01"
                value={form.valor_causa}
                onChange={e => set('valor_causa', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* valor_divida */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Valor da Divida</label>
              <input
                type="number"
                step="0.01"
                value={form.valor_divida}
                onChange={e => set('valor_divida', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* valor_atualizado */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Valor Atualizado</label>
              <input
                type="number"
                step="0.01"
                value={form.valor_atualizado}
                onChange={e => set('valor_atualizado', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* polo_ativo */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Polo Ativo</label>
              <input
                type="text"
                value={form.polo_ativo}
                onChange={e => set('polo_ativo', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* polo_passivo */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Polo Passivo</label>
              <input
                type="text"
                value={form.polo_passivo}
                onChange={e => set('polo_passivo', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* comarca */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Comarca</label>
              <input
                type="text"
                value={form.comarca}
                onChange={e => set('comarca', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* vara */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Vara</label>
              <input
                type="text"
                value={form.vara}
                onChange={e => set('vara', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* tribunal */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Tribunal</label>
              <input
                type="text"
                value={form.tribunal}
                onChange={e => set('tribunal', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* uf */}
            <div>
              <label className="block text-sm font-medium text-slate-700">UF</label>
              <input
                type="text"
                value={form.uf}
                onChange={e => set('uf', e.target.value)}
                className={inputClass}
                maxLength={2}
              />
            </div>

            {/* fase_processual */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Fase Processual</label>
              <input
                type="text"
                value={form.fase_processual}
                onChange={e => set('fase_processual', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* data_distribuicao */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Data Distribuicao</label>
              <input
                type="date"
                value={form.data_distribuicao}
                onChange={e => set('data_distribuicao', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* ultima_movimentacao */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Ultima Movimentacao
              </label>
              <input
                type="text"
                value={form.ultima_movimentacao}
                onChange={e => set('ultima_movimentacao', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* data_ultima_movimentacao */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Data Ultima Movimentacao
              </label>
              <input
                type="date"
                value={form.data_ultima_movimentacao}
                onChange={e => set('data_ultima_movimentacao', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* observacoes - full width */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Observacoes</label>
            <textarea
              value={form.observacoes}
              onChange={e => set('observacoes', e.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProcessosPage() {
  const [searchParams] = useSearchParams();
  const casoIdParam = searchParams.get('caso_id') || '';

  const [processos, setProcessos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(!!casoIdParam);

  // Filtros
  const [search, setSearch] = useState('');
  const [filterCasoId, setFilterCasoId] = useState(casoIdParam);
  const [filterTipoTese, setFilterTipoTese] = useState('');
  const [filterRecuperabilidade, setFilterRecuperabilidade] = useState('');
  const [filterUf, setFilterUf] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Lista de casos para filtro e modal
  const [casos, setCasos] = useState([]);

  useEffect(() => {
    api
      .get('/casos', { params: { per_page: 100 } })
      .then(res => setCasos(res.data.data || []))
      .catch(() => setCasos([]));
  }, []);

  const fetchProcessos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: 20 };
      if (search) params.search = search;
      if (filterCasoId) params.caso_id = filterCasoId;
      if (filterTipoTese) params.tipo_tese = filterTipoTese;
      if (filterRecuperabilidade) params.recuperabilidade = filterRecuperabilidade;
      if (filterUf) params.uf = filterUf;
      if (filterStatus) params.status = filterStatus;
      const { data } = await api.get('/processos', { params });
      setProcessos(data.data || []);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCasoId, filterTipoTese, filterRecuperabilidade, filterUf, filterStatus]);

  useEffect(() => {
    fetchProcessos();
  }, [fetchProcessos]);

  const handleSave = async formData => {
    if (editing) {
      await api.put(`/processos/${editing.id}`, formData);
    } else {
      await api.post('/processos', formData);
    }
    fetchProcessos();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/processos/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchProcessos();
    } catch (err) {
      alert('Erro ao excluir: ' + (err.response?.data?.error || err.message));
      setDeleteConfirm(null);
    }
  };

  const openEdit = processo => {
    setEditing(processo);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const clearFilters = () => {
    setSearch('');
    setFilterCasoId('');
    setFilterTipoTese('');
    setFilterRecuperabilidade('');
    setFilterUf('');
    setFilterStatus('');
    setPage(1);
  };

  const hasActiveFilters =
    search || filterCasoId || filterTipoTese || filterRecuperabilidade || filterUf || filterStatus;

  const casoNome = id => {
    const caso = casos.find(c => c.id === id || c.id === Number(id));
    return caso?.nome || '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Processos</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Novo Processo
        </button>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filtros
            {hasActiveFilters && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                !
              </span>
            )}
          </span>
          <svg
            className={cn('h-4 w-4 transition-transform', filtersOpen && 'rotate-180')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {filtersOpen && (
          <div className="border-t px-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Busca</label>
                <input
                  type="text"
                  placeholder="CNJ, partes, comarca..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Caso</label>
                <select
                  value={filterCasoId}
                  onChange={e => {
                    setFilterCasoId(e.target.value);
                    setPage(1);
                  }}
                  className={inputClass}
                >
                  <option value="">Todos</option>
                  {casos.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Tipo de Tese</label>
                <select
                  value={filterTipoTese}
                  onChange={e => {
                    setFilterTipoTese(e.target.value);
                    setPage(1);
                  }}
                  className={inputClass}
                >
                  <option value="">Todos</option>
                  {TIPO_TESE_OPTIONS.map(t => (
                    <option key={t} value={t}>
                      {t.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Recuperabilidade</label>
                <select
                  value={filterRecuperabilidade}
                  onChange={e => {
                    setFilterRecuperabilidade(e.target.value);
                    setPage(1);
                  }}
                  className={inputClass}
                >
                  <option value="">Todos</option>
                  {RECUPERABILIDADE_OPTIONS.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">UF</label>
                <input
                  type="text"
                  placeholder="Ex: SP, RJ..."
                  value={filterUf}
                  onChange={e => {
                    setFilterUf(e.target.value);
                    setPage(1);
                  }}
                  className={inputClass}
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Status</label>
                <select
                  value={filterStatus}
                  onChange={e => {
                    setFilterStatus(e.target.value);
                    setPage(1);
                  }}
                  className={inputClass}
                >
                  <option value="">Todos</option>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : processos.length === 0 ? (
        <EmptyState
          title="Nenhum processo"
          description={
            hasActiveFilters
              ? 'Nenhum resultado para os filtros aplicados'
              : 'Comece criando um novo processo'
          }
          action={
            !hasActiveFilters && (
              <button
                onClick={openCreate}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Novo Processo
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Numero CNJ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Caso
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tipo Tese
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Recuperabilidade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    UF
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Inc.
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {processos.map(processo => (
                  <tr key={processo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-indigo-600">
                      <Link to={`/admin/processos/${processo.id}`} className="hover:underline">
                        {processo.numero_cnj}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {processo.caso_nome || casoNome(processo.caso_id)}
                    </td>
                    <td className="px-4 py-3">
                      {processo.tipo_tese ? (
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {processo.tipo_tese.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {processo.recuperabilidade ? (
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                            recuperabilidadeBadge(processo.recuperabilidade)
                          )}
                        >
                          {processo.recuperabilidade}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{processo.uf || '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          statusBadge(processo.status)
                        )}
                      >
                        {processo.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {processo.is_incidental && (
                        <span
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700"
                          title="Incidental"
                        >
                          I
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/processos/${processo.id}`}
                        className="mr-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                      >
                        Ver
                      </Link>
                      <button
                        onClick={() => openEdit(processo)}
                        className="mr-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(processo)}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ProcessoFormModal
        open={modalOpen}
        editing={editing}
        onSave={handleSave}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        defaultCasoId={casoIdParam}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Excluir Processo"
        message={`Deseja excluir o processo "${deleteConfirm?.numero_cnj}"? Todos os dados vinculados serao removidos.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
