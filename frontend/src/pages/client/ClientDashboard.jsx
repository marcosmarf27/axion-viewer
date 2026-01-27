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
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
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
        <h1 className="text-2xl font-bold text-gray-900">Meu Painel</h1>
        <button
          onClick={fetchData}
          className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          Atualizar
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-2 inline-block rounded-md bg-indigo-500 p-2">
            <div className="h-4 w-4 text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.total_carteiras ?? 0}</p>
          <p className="text-sm text-gray-500">Carteiras</p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-2 inline-block rounded-md bg-purple-500 p-2">
            <div className="h-4 w-4 text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.total_casos ?? 0}</p>
          <p className="text-sm text-gray-500">Casos</p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-2 inline-block rounded-md bg-amber-500 p-2">
            <div className="h-4 w-4 text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.total_processos ?? 0}</p>
          <p className="text-sm text-gray-500">Processos</p>
        </div>
      </div>

      {/* Carteiras */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Minhas Carteiras</h2>
          <Link
            to="/carteiras"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Ver todas
          </Link>
        </div>

        {carteiras.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-500">
            Nenhuma carteira disponivel.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {carteiras.map(carteira => {
              const sc = statusConfig[carteira.status] || {
                label: carteira.status,
                className: 'bg-gray-100 text-gray-700',
              };
              return (
                <Link
                  key={carteira.id}
                  to={`/carteiras/${carteira.id}/casos`}
                  className="rounded-lg border p-4 transition-shadow hover:shadow-md"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="truncate font-medium text-gray-900">{carteira.nome}</h3>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${sc.className}`}
                    >
                      {sc.label}
                    </span>
                  </div>
                  {carteira.descricao && (
                    <p className="mb-3 line-clamp-2 text-sm text-gray-500">{carteira.descricao}</p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>
                      <span className="font-medium text-gray-900">{carteira.qtd_casos ?? 0}</span>{' '}
                      casos
                    </span>
                    <span>
                      <span className="font-medium text-gray-900">
                        {carteira.qtd_processos ?? 0}
                      </span>{' '}
                      processos
                    </span>
                  </div>
                  {carteira.valor_total != null && Number(carteira.valor_total) > 0 && (
                    <p className="mt-2 text-sm font-medium text-gray-900">
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
