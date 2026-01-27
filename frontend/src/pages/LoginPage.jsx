import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import TypewriterASCII from '@/components/TypewriterASCII';

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message || 'Falha ao fazer login');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Login Form */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Logo mark */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-200">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6 text-white"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6l9-3 9 3M3 6v2l9 3 9-3V6" />
                <path d="M3 8v6c0 1 1.5 3 9 3s9-2 9-3V8" />
                <line x1="12" y1="11" x2="12" y2="21" />
              </svg>
            </div>
            <h1 className="bg-gradient-to-r from-slate-900 to-indigo-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
              Acesse sua conta
            </h1>
            <p className="mt-2 text-sm text-slate-500">Gerencie documentos e processos juridicos</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-xl border border-slate-100 bg-white p-6 shadow-md"
          >
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Sua senha"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Axion Viewer &mdash; Plataforma de Gestao Juridica
          </p>
        </div>
      </div>

      {/* Right Panel — Corporate Branding */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 lg:flex lg:w-1/2 lg:items-center lg:justify-center">
        {/* Typewriter ASCII background */}
        <TypewriterASCII className="absolute inset-0 z-0" />

        {/* Subtle radial glow */}
        <div className="absolute left-1/2 top-1/2 z-[1] h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 max-w-md px-10 text-center">
          {/* Scale of Justice icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-8 w-8 text-indigo-300"
              stroke="currentColor"
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v18" />
              <path d="M5 7l7-4 7 4" />
              <path d="M5 7l-1 5c0 1.5 1 2 2.5 2S9 13.5 9 12L8 7" />
              <path d="M19 7l-1 5c0 1.5 1 2 2.5 2S23 13.5 23 12l-1-5" />
              <path d="M9 21h6" />
            </svg>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white">Axion Viewer</h2>
          <p className="mt-2 text-base text-slate-400">Plataforma de Gestao Juridica</p>

          {/* Separator */}
          <div className="mx-auto my-8 h-px w-16 bg-indigo-500/40" />

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-5 text-left">
            {/* Feature 1: Document Management */}
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
                <svg
                  className="h-4.5 w-4.5 text-indigo-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-200">Gestao de Documentos</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Controle completo de processos e casos
              </p>
            </div>

            {/* Feature 2: Auto Conversion */}
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
                <svg
                  className="h-4.5 w-4.5 text-indigo-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 014-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 01-4 4H3" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-200">Conversao Automatica</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Markdown para HTML e PDF
              </p>
            </div>

            {/* Feature 3: Access Control */}
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
                <svg
                  className="h-4.5 w-4.5 text-indigo-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-200">Controle de Acesso</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Permissoes granulares por carteira
              </p>
            </div>

            {/* Feature 4: Professional Reports */}
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
                <svg
                  className="h-4.5 w-4.5 text-indigo-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 20V10" />
                  <path d="M12 20V4" />
                  <path d="M6 20v-6" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-200">Relatorios Profissionais</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Documentos formatados com temas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
