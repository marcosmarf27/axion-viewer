import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';

const statusConfig = {
  ativa: { label: 'Ativa', className: 'bg-green-100 text-green-700' },
  em_analise: { label: 'Em Analise', className: 'bg-yellow-100 text-yellow-700' },
  encerrada: { label: 'Encerrada', className: 'bg-red-100 text-red-700' },
};

export default function ClientCarteirasPage() {
  const [carteiras, setCarteiras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCarteiras = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: 20 };
      if (search) params.search = search;
      const { data } = await api.get('/carteiras', { params });
      setCarteiras(data.data || []);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCarteiras();
  }, [fetchCarteiras]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Minhas Carteiras</h1>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : carteiras.length === 0 ? (
        <EmptyState
          title="Nenhuma carteira"
          description={
            search
              ? 'Nenhum resultado para a busca realizada'
              : 'Voce ainda nao possui carteiras compartilhadas'
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {carteiras.map(carteira => {
              const sc = statusConfig[carteira.status] || {
                label: carteira.status,
                className: 'bg-gray-100 text-gray-700',
              };
              return (
                <Link
                  key={carteira.id}
                  to={`/carteiras/${carteira.id}/casos`}
                  className="rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="truncate text-base font-semibold text-gray-900">
                      {carteira.nome}
                    </h3>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${sc.className}`}
                    >
                      {sc.label}
                    </span>
                  </div>

                  {carteira.descricao && (
                    <p className="mb-4 line-clamp-2 text-sm text-gray-500">{carteira.descricao}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {carteira.qtd_casos ?? 0}
                      </span>{' '}
                      casos
                    </span>
                    <span>
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {carteira.qtd_processos ?? 0}
                      </span>{' '}
                      processos
                    </span>
                  </div>

                  {carteira.valor_total != null && Number(carteira.valor_total) > 0 && (
                    <p className="mt-3 text-sm font-semibold text-gray-900">
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

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
