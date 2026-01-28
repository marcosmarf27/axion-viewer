import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';

const statusConfig = {
  ativa: { label: 'Ativa', className: 'bg-green-100 text-green-700' },
  em_analise: { label: 'Em Analise', className: 'bg-yellow-100 text-yellow-700' },
  encerrada: { label: 'Encerrada', className: 'bg-red-100 text-red-700' },
};

export default function ClientDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/dashboard/client');
      setStats(data.data || data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Erro ao carregar dashboard: {error}</p>
        <button onClick={fetchData} className="mt-2 text-sm font-medium text-red-700 underline">
          Tentar novamente
        </button>
      </div>
    );
  }

  const carteiras = stats?.carteiras || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Meu Painel</h1>
        <button
          onClick={fetchData}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
        >
          Atualizar
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
          <div className="mb-2 inline-flex rounded-lg bg-indigo-500 p-2.5">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
              />
            </svg>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.total_carteiras ?? 0}</p>
          <p className="text-sm text-slate-500">Carteiras</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
          <div className="mb-2 inline-flex rounded-lg bg-purple-500 p-2.5">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
              />
            </svg>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.total_casos ?? 0}</p>
          <p className="text-sm text-slate-500">Casos</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
          <div className="mb-2 inline-flex rounded-lg bg-amber-500 p-2.5">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z"
              />
            </svg>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.total_processos ?? 0}</p>
          <p className="text-sm text-slate-500">Processos</p>
        </div>
      </div>

      {/* Carteiras */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Minhas Carteiras</h2>
          <Link
            to="/carteiras"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Ver todas
          </Link>
        </div>

        {carteiras.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-500">
            Nenhuma carteira disponivel.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {carteiras.map(carteira => {
              const sc = statusConfig[carteira.status] || {
                label: carteira.status,
                className: 'bg-slate-100 text-slate-700',
              };
              return (
                <Link
                  key={carteira.id}
                  to={`/carteiras/${carteira.id}/casos`}
                  className="rounded-xl border border-slate-200 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="truncate font-medium text-slate-900">{carteira.nome}</h3>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${sc.className}`}
                    >
                      {sc.label}
                    </span>
                  </div>
                  {carteira.descricao && (
                    <p className="mb-3 line-clamp-2 text-sm text-slate-500">{carteira.descricao}</p>
                  )}
                  <div className="flex gap-4 text-sm text-slate-600">
                    <span>
                      <span className="font-medium text-slate-900">{carteira.qtd_casos ?? 0}</span>{' '}
                      casos
                    </span>
                    <span>
                      <span className="font-medium text-slate-900">
                        {carteira.qtd_processos ?? 0}
                      </span>{' '}
                      processos
                    </span>
                  </div>
                  {carteira.valor_total != null && Number(carteira.valor_total) > 0 && (
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {Number(carteira.valor_total).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
