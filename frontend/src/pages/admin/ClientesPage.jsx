import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';

const emptyForm = {
  nome: '',
  email: '',
  telefone: '',
  documento: '',
  tipo: 'PJ',
  status: 'ativo',
};

function ClienteFormModal({ open, editing, onSave, onClose }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editing) {
      setForm({
        nome: editing.nome || '',
        email: editing.email || '',
        telefone: editing.telefone || '',
        documento: editing.documento || '',
        tipo: editing.tipo || 'PJ',
        status: editing.status || 'ativo',
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
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
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
          {editing ? 'Editar Cliente' : 'Novo Cliente'}
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
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Telefone</label>
            <input
              type="text"
              value={form.telefone}
              onChange={e => setForm({ ...form, telefone: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Documento (CPF/CNPJ)</label>
            <input
              type="text"
              value={form.documento}
              onChange={e => setForm({ ...form, documento: e.target.value })}
              placeholder="Ex: 12.345.678/0001-90"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
            <p className="mt-1 text-xs text-slate-500">
              CPF (pessoa fisica) ou CNPJ (pessoa juridica) do cliente
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Tipo</label>
              <select
                value={form.tipo}
                onChange={e => setForm({ ...form, tipo: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              >
                <option value="PJ">Pessoa Juridica</option>
                <option value="PF">Pessoa Fisica</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
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

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: 20 };
      if (search) params.search = search;
      const { data } = await api.get('/clientes', { params });
      setClientes(data.data || []);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleSave = async formData => {
    if (editing) {
      await api.put(`/clientes/${editing.id}`, formData);
    } else {
      await api.post('/clientes', formData);
    }
    fetchClientes();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/clientes/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchClientes();
    } catch (err) {
      alert('Erro ao excluir: ' + (err.response?.data?.error || err.message));
      setDeleteConfirm(null);
    }
  };

  const openEdit = cliente => {
    setEditing(cliente);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Buscar por nome, email ou documento..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : clientes.length === 0 ? (
        <EmptyState
          title="Nenhum cliente"
          description={search ? 'Nenhum resultado para a busca' : 'Comece criando um novo cliente'}
          action={
            !search && (
              <button
                onClick={openCreate}
                className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
              >
                Novo Cliente
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
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Documento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tipo
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
                {clientes.map(cliente => (
                  <tr key={cliente.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{cliente.nome}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{cliente.email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{cliente.documento || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {cliente.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          cliente.status === 'ativo'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        )}
                      >
                        {cliente.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(cliente)}
                        className="mr-2 text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(cliente)}
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

      <ClienteFormModal
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
        title="Excluir Cliente"
        message={`Deseja excluir o cliente "${deleteConfirm?.nome}"? Todos os dados vinculados serao removidos.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
