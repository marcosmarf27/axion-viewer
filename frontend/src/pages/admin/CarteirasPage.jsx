import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';

const emptyForm = {
  nome: '',
  descricao: '',
  cliente_id: '',
  data_aquisicao: '',
  valor_total: '',
  status: 'em_analise',
};

const statusConfig = {
  ativa: { label: 'Ativa', className: 'bg-green-100 text-green-700' },
  em_analise: { label: 'Em Analise', className: 'bg-yellow-100 text-yellow-700' },
  encerrada: { label: 'Encerrada', className: 'bg-red-100 text-red-700' },
};

function CarteiraFormModal({ open, editing, onSave, onClose }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    if (open) {
      api
        .get('/clientes')
        .then(res => setClientes(res.data.data || []))
        .catch(() => setClientes([]));
    }
  }, [open]);

  useEffect(() => {
    if (editing) {
      setForm({
        nome: editing.nome || '',
        descricao: editing.descricao || '',
        cliente_id: editing.cliente_id || '',
        data_aquisicao: editing.data_aquisicao || '',
        valor_total: editing.valor_total ?? '',
        status: editing.status || 'em_analise',
      });
    } else {
      setForm(emptyForm);
    }
    setError(null);
  }, [editing, open]);

  if (!open) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.nome.trim()) {
      setError('Nome e obrigatorio');
      return;
    }
    if (!form.cliente_id) {
      setError('Cliente e obrigatorio');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
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
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {editing ? 'Editar Carteira' : 'Nova Carteira'}
        </h2>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome *</label>
            <input
              type="text"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Descricao</label>
            <textarea
              value={form.descricao}
              onChange={e => setForm({ ...form, descricao: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Cliente *</label>
            <select
              value={form.cliente_id}
              onChange={e => setForm({ ...form, cliente_id: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              required
            >
              <option value="">Selecione um cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Data Aquisicao</label>
              <input
                type="date"
                value={form.data_aquisicao}
                onChange={e => setForm({ ...form, data_aquisicao: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Valor Total</label>
              <input
                type="number"
                step="0.01"
                value={form.valor_total}
                onChange={e => setForm({ ...form, valor_total: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Status</label>
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            >
              <option value="em_analise">Em Analise</option>
              <option value="ativa">Ativa</option>
              <option value="encerrada">Encerrada</option>
            </select>
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

export default function CarteirasPage() {
  const [carteiras, setCarteiras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [clienteFilter, setClienteFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    api
      .get('/clientes')
      .then(res => setClientes(res.data.data || []))
      .catch(() => setClientes([]));
  }, []);

  const fetchCarteiras = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: 20 };
      if (search) params.search = search;
      if (clienteFilter) params.cliente_id = clienteFilter;
      const { data } = await api.get('/carteiras', { params });
      setCarteiras(data.data || []);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, clienteFilter]);

  useEffect(() => {
    fetchCarteiras();
  }, [fetchCarteiras]);

  const handleSave = async formData => {
    if (editing) {
      await api.put(`/carteiras/${editing.id}`, formData);
    } else {
      await api.post('/carteiras', formData);
    }
    fetchCarteiras();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/carteiras/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchCarteiras();
    } catch (err) {
      alert('Erro ao excluir: ' + (err.response?.data?.error || err.message));
      setDeleteConfirm(null);
    }
  };

  const openEdit = carteira => {
    setEditing(carteira);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const getStatusBadge = status => {
    const config = statusConfig[status] || {
      label: status,
      className: 'bg-slate-100 text-slate-700',
    };
    return (
      <span
        className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', config.className)}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Carteiras</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          Nova Carteira
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        <select
          value={clienteFilter}
          onChange={e => {
            setClienteFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        >
          <option value="">Todos os clientes</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : carteiras.length === 0 ? (
        <EmptyState
          title="Nenhuma carteira"
          description={
            search || clienteFilter
              ? 'Nenhum resultado para os filtros aplicados'
              : 'Comece criando uma nova carteira'
          }
          action={
            !search &&
            !clienteFilter && (
              <button
                onClick={openCreate}
                className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
              >
                Nova Carteira
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
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Casos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Processos
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
                {carteiras.map(carteira => (
                  <tr key={carteira.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]">
                      <Link to={`/admin/carteiras/${carteira.id}/casos`}>{carteira.nome}</Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {carteira.cliente?.nome || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {carteira.qtd_casos ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {carteira.qtd_processos ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(carteira.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(carteira)}
                        className="mr-2 text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(carteira)}
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

      <CarteiraFormModal
        open={modalOpen}
        editing={editing}
        onSave={handleSave}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Excluir Carteira"
        message={`Deseja excluir a carteira "${deleteConfirm?.nome}"? Todos os dados vinculados serao removidos.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
