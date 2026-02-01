import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function ProfileEditModal({ isOpen, onClose }) {
  const { profile, user, refreshProfile } = useAuth();
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (profile?.telefone) setTelefone(profile.telefone);
  }, [profile]);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      setSenha('');
      setConfirmSenha('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (confirmSenha && !senha) {
      setError('Preencha o campo "Nova Senha" antes de confirmar');
      return;
    }
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
      // Atualizar telefone no profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ telefone, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Atualizar senha se informada
      if (senha) {
        const { error: authError } = await supabase.auth.updateUser({ password: senha });
        if (authError) throw authError;
      }

      // Atualizar profile no contexto
      if (profile?.id) {
        await refreshProfile(profile.id);
      }

      setSuccess('Perfil atualizado com sucesso!');
      setSenha('');
      setConfirmSenha('');
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Editar Perfil</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md p-1 text-[var(--color-text-subtle)] hover:bg-[var(--color-accent-subtle)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email (read-only) */}
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
              Email
            </label>
            <input
              type="email"
              value={user?.email || profile?.email || ''}
              disabled
              className="w-full rounded-md border border-[var(--color-border)] bg-gray-50 px-3 py-2 text-sm text-[var(--color-text-muted)] cursor-not-allowed"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
              Telefone
            </label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 border-t border-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-text-subtle)]">Alterar senha</span>
            <div className="flex-1 border-t border-[var(--color-border)]" />
          </div>

          {/* Nova senha */}
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
              Nova Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Deixe em branco para manter"
              className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          {/* Confirmar senha */}
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
              Confirmar Senha
            </label>
            <input
              type="password"
              value={confirmSenha}
              onChange={(e) => setConfirmSenha(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-600">
              {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] transition hover:bg-[var(--color-accent-subtle)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
