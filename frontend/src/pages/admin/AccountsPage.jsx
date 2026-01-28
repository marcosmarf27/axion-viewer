import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';

const emptyAccountForm = {
  email: '',
  password: '',
  full_name: '',
};

function FeedbackMessage({ message, type, onDismiss }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={
        type === 'success'
          ? 'rounded-lg bg-green-50 p-3 text-sm text-green-700'
          : 'rounded-lg bg-red-50 p-3 text-sm text-red-700'
      }
    >
      {message}
    </div>
  );
}

function CreateAccountModal({ open, onSave, onClose }) {
  const [form, setForm] = useState(emptyAccountForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(emptyAccountForm);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email.trim()) {
      setError('Email e obrigatorio');
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError('Senha deve ter no minimo 6 caracteres');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim() || undefined,
      });
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
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Nova Conta</h2>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Senha *</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Nome completo</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
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
              {saving ? 'Criando...' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ open, account, onSave, onClose }) {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setPassword('');
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError('Senha deve ter no minimo 6 caracteres');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(account.id, password);
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
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Resetar Senha</h2>
        <p className="mb-4 text-sm text-slate-600">
          Definir nova senha para <strong>{account?.email}</strong>
        </p>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nova senha *</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              required
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
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ message: null, type: null });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setFeedback({ message: null, type: null });
    try {
      const { data } = await api.get('/accounts');
      setAccounts(data.data || data || []);
    } catch (err) {
      setFeedback({
        message: err.response?.data?.error || err.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleCreate = async formData => {
    await api.post('/accounts', formData);
    setFeedback({ message: 'Conta criada com sucesso', type: 'success' });
    fetchAccounts();
  };

  const handleResetPassword = async (id, newPassword) => {
    await api.put(`/accounts/${id}/password`, { password: newPassword });
    setFeedback({ message: 'Senha resetada com sucesso', type: 'success' });
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/accounts/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      setFeedback({ message: 'Conta excluida com sucesso', type: 'success' });
      fetchAccounts();
    } catch (err) {
      setDeleteConfirm(null);
      setFeedback({
        message: 'Erro ao excluir: ' + (err.response?.data?.error || err.message),
        type: 'error',
      });
    }
  };

  const formatDate = dateStr => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Contas</h1>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          Nova Conta
        </button>
      </div>

      <FeedbackMessage
        message={feedback.message}
        type={feedback.type}
        onDismiss={() => setFeedback({ message: null, type: null })}
      />

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : accounts.length === 0 ? (
        <EmptyState
          title="Nenhuma conta"
          description="Comece criando uma nova conta de usuario"
          action={
            <button
              onClick={() => setCreateModalOpen(true)}
              className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
            >
              Nova Conta
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Criado em
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {accounts.map(account => (
                <tr key={account.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{account.email}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {account.user_metadata?.full_name || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        account.user_metadata?.role === 'admin'
                          ? 'inline-flex rounded-full bg-[rgba(26,54,93,0.08)] px-2 py-0.5 text-xs font-medium text-[var(--color-accent)]'
                          : 'inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700'
                      }
                    >
                      {account.user_metadata?.role || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatDate(account.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setResetTarget(account)}
                      className="mr-2 text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                    >
                      Resetar senha
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(account)}
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
      )}

      <CreateAccountModal
        open={createModalOpen}
        onSave={handleCreate}
        onClose={() => setCreateModalOpen(false)}
      />

      <ResetPasswordModal
        open={!!resetTarget}
        account={resetTarget}
        onSave={handleResetPassword}
        onClose={() => setResetTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Excluir Conta"
        message={`Deseja excluir a conta "${deleteConfirm?.email}"? Esta acao nao pode ser desfeita.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
