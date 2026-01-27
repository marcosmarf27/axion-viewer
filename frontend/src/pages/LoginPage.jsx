import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import MatrixRainCanvas from '@/components/MatrixRainCanvas';

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
      {/* Painel Esquerdo - Formulário */}
      <div className="flex w-full flex-col items-center justify-center bg-gray-50 px-4 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Axion Viewer</h1>
            <p className="mt-2 text-sm text-gray-600">Entre com suas credenciais</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            {error && (
              <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Sua senha"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>

      {/* Painel Direito - Animação (hidden no mobile) */}
      <div className="relative hidden overflow-hidden bg-gray-950 lg:flex lg:w-1/2 lg:items-center lg:justify-center">
        <MatrixRainCanvas className="absolute inset-0" />

        {/* Branding Overlay */}
        <div className="relative z-10 max-w-md px-8 text-center">
          <div className="mb-4 text-4xl font-bold tracking-tight text-white">
            Axion<span className="text-emerald-400"> Viewer</span>
          </div>
          <p className="text-lg text-gray-400">Relatórios jurídicos inteligentes</p>
          <div className="mt-6 flex items-center justify-center gap-3 text-sm text-gray-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Conversão automática
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Templates profissionais
          </div>
        </div>
      </div>
    </div>
  );
}
