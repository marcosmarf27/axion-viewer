import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';

const TESES = ['NPL', 'RJ', 'Divida_Ativa', 'Litigio'];
const RECUPERABILIDADES = ['Alta', 'Potencial', 'Critica', 'Indefinida', 'Nenhuma'];
const STATUSES = ['em_andamento', 'concluido', 'arquivado'];

const recuperabilidadeBadge = valor => {
  switch (valor) {
    case 'Alta':
      return 'bg-green-100 text-green-700';
    case 'Potencial':
      return 'bg-indigo-100 text-indigo-700';
    case 'Critica':
      return 'bg-red-100 text-red-700';
    case 'Indefinida':
      return 'bg-gray-100 text-gray-600';
    case 'Nenhuma':
      return 'bg-gray-200 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const statusBadge = valor => {
  switch (valor) {
    case 'em_andamento':
      return 'bg-blue-100 text-blue-700';
    case 'concluido':
      return 'bg-green-100 text-green-700';
    case 'arquivado':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
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

function formatCurrency(value) {
  if (value == null) return '-';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ClientCasosPage() {
  const { id: carteiraId } = useParams();

  const [casos, setCasos] = useState([]);
  const [carteiraNome, setCarteiraNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTese, setFilterTese] = useState('');
  const [filterRecuperabilidade, setFilterRecuperabilidade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    api
      .get(`/carteiras/${carteiraId}`)
      .then(({ data }) => setCarteiraNome(data.nome || ''))
      .catch(() => {});
  }, [carteiraId]);

  const fetchCasos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: 20, carteira_id: carteiraId };
      if (search) params.search = search;
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
  }, [carteiraId, page, search, filterTese, filterRecuperabilidade, filterStatus]);

  useEffect(() => {
    fetchCasos();
  }, [fetchCasos]);

  const hasFilters = search || filterTese || filterRecuperabilidade || filterStatus;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/carteiras" className="font-medium text-indigo-600 hover:text-indigo-800">
          Carteiras
        </Link>
        <span>/</span>
        <span className="text-gray-900">{carteiraNome || 'Casos'}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">
        Casos {carteiraNome ? `- ${carteiraNome}` : ''}
      </h1>

      {/* Filters */}
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
            className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500">Tese</label>
          <select
            value={filterTese}
            onChange={e => {
              setFilterTese(e.target.value);
              setPage(1);
            }}
            className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
          <label className="block text-xs font-medium text-gray-500">Recuperabilidade</label>
          <select
            value={filterRecuperabilidade}
            onChange={e => {
              setFilterRecuperabilidade(e.target.value);
              setPage(1);
            }}
            className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
          <label className="block text-xs font-medium text-gray-500">Status</label>
          <select
            value={filterStatus}
            onChange={e => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : casos.length === 0 ? (
        <EmptyState
          title="Nenhum caso"
          description={
            hasFilters
              ? 'Nenhum resultado para os filtros aplicados'
              : 'Nenhum caso encontrado nesta carteira'
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Tese
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Recuperabilidade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {casos.map(caso => (
                  <tr key={caso.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">
                      <Link
                        to={`/casos/${caso.id}/processos`}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {caso.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {caso.tese ? (
                        <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                          {caso.tese.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
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
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatCurrency(caso.valor_total)}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
