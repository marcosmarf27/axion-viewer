import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';

const TESES = ['NPL', 'RJ', 'Divida_Ativa', 'Litigio'];
const RECUPERABILIDADES = ['Alta', 'Potencial', 'Critica', 'Indefinida', 'Nenhuma'];
const STATUSES = ['em_andamento', 'concluido', 'arquivado'];

const inputClass =
  'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]';

const emptyForm = {
  nome: '',
  descricao: '',
  carteira_id: '',
  tese: '',
  credor_principal: '',
  devedor_principal: '',
  cnpj_cpf_devedor: '',
  valor_total: '',
  recuperabilidade: '',
  uf_principal: '',
  observacoes: '',
  status: 'em_andamento',
};

const recuperabilidadeBadge = valor => {
  switch (valor) {
    case 'Alta':
      return 'bg-green-100 text-green-700';
    case 'Potencial':
      return 'bg-[rgba(26,54,93,0.08)] text-[var(--color-accent)]';
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

const statusBadge = valor => {
  switch (valor) {
    case 'em_andamento':
      return 'bg-blue-100 text-blue-700';
    case 'concluido':
      return 'bg-green-100 text-green-700';
    case 'arquivado':
      return 'bg-slate-100 text-slate-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
};

const statusLabel = valor => {
  switch (valor) {
    case 'em_andamento':
      return 'Em andamento';
    case 'concluido':
      return 'Concluido';
    case 'arquivado':
      return 'Arquivado';
    default:
      return valor;
  }
};

function CasoFormModal({ open, editing, carteiras, defaultCarteiraId, onSave, onClose }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editing) {
      setForm({
        nome: editing.nome || '',
        descricao: editing.descricao || '',
        carteira_id: editing.carteira_id || '',
        tese: editing.tese || '',
        credor_principal: editing.credor_principal || '',
        devedor_principal: editing.devedor_principal || '',
        cnpj_cpf_devedor: editing.cnpj_cpf_devedor || '',
        valor_total: editing.valor_total ?? '',
        recuperabilidade: editing.recuperabilidade || '',
        uf_principal: editing.uf_principal || '',
        observacoes: editing.observacoes || '',
        status: editing.status || 'em_andamento',
      });
    } else {
      setForm({
        ...emptyForm,
        carteira_id: defaultCarteiraId || '',
      });
    }
    setError(null);
  }, [editing, open, defaultCarteiraId]);

  if (!open) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.nome.trim()) {
      setError('Nome e obrigatorio');
      return;
    }
    if (!form.carteira_id) {
      setError('Carteira e obrigatoria');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        tese: form.tese || null,
        recuperabilidade: form.recuperabilidade || null,
        valor_total: form.valor_total !== '' ? Number(form.valor_total) : null,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {editing ? 'Editar Caso' : 'Novo Caso'}
        </h2>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome *</label>
            <input
              type="text"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Descricao</label>
            <textarea
              value={form.descricao}
              onChange={e => setForm({ ...form, descricao: e.target.value })}
              rows={3}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Carteira *</label>
            <select
              value={form.carteira_id}
              onChange={e => setForm({ ...form, carteira_id: e.target.value })}
              className={inputClass}
              required
            >
              <option value="">Selecione uma carteira</option>
              {carteiras.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Tese</label>
              <select
                value={form.tese}
                onChange={e => setForm({ ...form, tese: e.target.value })}
                className={inputClass}
              >
                <option value="">-</option>
                {TESES.map(t => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Recuperabilidade</label>
              <select
                value={form.recuperabilidade}
                onChange={e => setForm({ ...form, recuperabilidade: e.target.value })}
                className={inputClass}
              >
                <option value="">-</option>
                {RECUPERABILIDADES.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Credor Principal</label>
              <input
                type="text"
                value={form.credor_principal}
                onChange={e => setForm({ ...form, credor_principal: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Devedor Principal</label>
              <input
                type="text"
                value={form.devedor_principal}
                onChange={e => setForm({ ...form, devedor_principal: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">CNPJ/CPF Devedor</label>
              <input
                type="text"
                value={form.cnpj_cpf_devedor}
                onChange={e => setForm({ ...form, cnpj_cpf_devedor: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Valor Total</label>
              <input
                type="number"
                step="0.01"
                value={form.valor_total}
                onChange={e => setForm({ ...form, valor_total: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">UF Principal</label>
              <input
                type="text"
                value={form.uf_principal}
                onChange={e => setForm({ ...form, uf_principal: e.target.value })}
                className={inputClass}
                maxLength={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className={inputClass}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Observacoes</label>
            <textarea
              value={form.observacoes}
              onChange={e => setForm({ ...form, observacoes: e.target.value })}
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
              className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CasosPage() {
  const [searchParams] = useSearchParams();
  const carteiraIdParam = searchParams.get('carteira_id') || '';

  const [casos, setCasos] = useState([]);
  const [carteiras, setCarteiras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCarteira, setFilterCarteira] = useState(carteiraIdParam);
  const [filterTese, setFilterTese] = useState('');
  const [filterRecuperabilidade, setFilterRecuperabilidade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Carrega lista de carteiras para filtro e formulario
  useEffect(() => {
    api
      .get('/carteiras', { params: { per_page: 100 } })
      .then(({ data }) => setCarteiras(data.data || []))
      .catch(() => {});
  }, []);

  const fetchCasos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: 20 };
      if (search) params.search = search;
      if (filterCarteira) params.carteira_id = filterCarteira;
      if (filterTese) params.tese = filterTese;
      if (filterRecuperabilidade) params.recuperabilidade = filterRecuperabilidade;
      if (filterStatus) params.status = filterStatus;
      const { data } = await api.get('/casos', { params });
      setCasos(data.data || []);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCarteira, filterTese, filterRecuperabilidade, filterStatus]);

  useEffect(() => {
    fetchCasos();
  }, [fetchCasos]);

  const handleSave = async formData => {
    if (editing) {
      await api.put(`/casos/${editing.id}`, formData);
    } else {
      await api.post('/casos', formData);
    }
    fetchCasos();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/casos/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchCasos();
    } catch (err) {
      alert('Erro ao excluir: ' + (err.response?.data?.error || err.message));
      setDeleteConfirm(null);
    }
  };

  const openEdit = caso => {
    setEditing(caso);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const carteiraNome = carteiraId => {
    const c = carteiras.find(c => String(c.id) === String(carteiraId));
    return c ? c.nome : '-';
  };

  const pageTitle = carteiraIdParam
    ? `Casos da Carteira ${carteiraNome(carteiraIdParam)}`
    : 'Casos';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          Novo Caso
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500">Carteira</label>
          <select
            value={filterCarteira}
            onChange={e => {
              setFilterCarteira(e.target.value);
              setPage(1);
            }}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          >
            <option value="">Todas</option>
            {carteiras.map(c => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500">Tese</label>
          <select
            value={filterTese}
            onChange={e => {
              setFilterTese(e.target.value);
              setPage(1);
            }}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          >
            <option value="">Todas</option>
            {TESES.map(t => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500">Recuperabilidade</label>
          <select
            value={filterRecuperabilidade}
            onChange={e => {
              setFilterRecuperabilidade(e.target.value);
              setPage(1);
            }}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          >
            <option value="">Todas</option>
            {RECUPERABILIDADES.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500">Status</label>
          <select
            value={filterStatus}
            onChange={e => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          >
            <option value="">Todos</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : casos.length === 0 ? (
        <EmptyState
          title="Nenhum caso"
          description={
            search || filterCarteira || filterTese || filterRecuperabilidade || filterStatus
              ? 'Nenhum resultado para os filtros aplicados'
              : 'Comece criando um novo caso'
          }
          action={
            !search &&
            !filterCarteira &&
            !filterTese &&
            !filterRecuperabilidade &&
            !filterStatus && (
              <button
                onClick={openCreate}
                className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
              >
                Novo Caso
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
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Carteira
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tese
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Recuperabilidade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {casos.map(caso => (
                  <tr key={caso.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">
                      <Link
                        to={`/admin/casos/${caso.id}/processos`}
                        className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] hover:underline"
                      >
                        {caso.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {caso.carteira?.nome || carteiraNome(caso.carteira_id)}
                    </td>
                    <td className="px-4 py-3">
                      {caso.tese ? (
                        <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                          {caso.tese.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {caso.recuperabilidade ? (
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                            recuperabilidadeBadge(caso.recuperabilidade)
                          )}
                        >
                          {caso.recuperabilidade}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          statusBadge(caso.status)
                        )}
                      >
                        {statusLabel(caso.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(caso)}
                        className="mr-2 text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(caso)}
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

      <CasoFormModal
        open={modalOpen}
        editing={editing}
        carteiras={carteiras}
        defaultCarteiraId={carteiraIdParam}
        onSave={handleSave}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Excluir Caso"
        message={`Deseja excluir o caso "${deleteConfirm?.nome}"? Todos os dados vinculados serao removidos.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
