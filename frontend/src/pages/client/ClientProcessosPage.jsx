import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';

const TIPO_TESE_OPTIONS = ['NPL', 'RJ', 'Divida_Ativa', 'Litigio'];
const RECUPERABILIDADE_OPTIONS = ['Alta', 'Potencial', 'Critica', 'Indefinida', 'Nenhuma'];
const STATUS_OPTIONS = ['ativo', 'suspenso', 'arquivado', 'encerrado'];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Data de criacao' },
  { value: 'data_distribuicao', label: 'Data de distribuicao' },
  { value: 'numero_cnj', label: 'Numero CNJ' },
  { value: 'valor_causa', label: 'Valor da causa' },
];

const inputClass =
  'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

const recuperabilidadeBadge = value => {
  switch (value) {
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

const statusBadge = value => {
  switch (value) {
    case 'ativo':
      return 'bg-green-100 text-green-700';
    case 'suspenso':
      return 'bg-yellow-100 text-yellow-700';
    case 'arquivado':
      return 'bg-gray-100 text-gray-600';
    case 'encerrado':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

function formatCurrency(value) {
  if (value == null) return '-';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ClientProcessosPage() {
  const { id: casoId } = useParams();

  const [processos, setProcessos] = useState([]);
  const [casoNome, setCasoNome] = useState('');
  const [carteiraId, setCarteiraId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filtros completos do PRD
  const [search, setSearch] = useState('');
  const [filterTipoTese, setFilterTipoTese] = useState('');
  const [filterRecuperabilidade, setFilterRecuperabilidade] = useState('');
  const [filterValorMin, setFilterValorMin] = useState('');
  const [filterValorMax, setFilterValorMax] = useState('');
  const [filterUf, setFilterUf] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    api
      .get(`/casos/${casoId}`)
      .then(({ data }) => {
        setCasoNome(data.nome || '');
        setCarteiraId(data.carteira_id || '');
      })
      .catch(() => {});
  }, [casoId]);

  const fetchProcessos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: 20, caso_id: casoId, sort_field: sortField, sort_order: sortOrder };
      if (search) params.search = search;
      if (filterTipoTese) params.tipo_tese = filterTipoTese;
      if (filterRecuperabilidade) params.recuperabilidade = filterRecuperabilidade;
      if (filterValorMin) params.valor_min = filterValorMin;
      if (filterValorMax) params.valor_max = filterValorMax;
      if (filterUf) params.uf = filterUf;
      if (filterStatus) params.status = filterStatus;
      if (filterDataInicio) params.data_inicio = filterDataInicio;
      if (filterDataFim) params.data_fim = filterDataFim;
      const { data } = await api.get('/processos', { params });
      setProcessos(data.data || []);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [
    casoId,
    page,
    search,
    filterTipoTese,
    filterRecuperabilidade,
    filterValorMin,
    filterValorMax,
    filterUf,
    filterStatus,
    filterDataInicio,
    filterDataFim,
    sortField,
    sortOrder,
  ]);

  useEffect(() => {
    fetchProcessos();
  }, [fetchProcessos]);

  const clearFilters = () => {
    setSearch('');
    setFilterTipoTese('');
    setFilterRecuperabilidade('');
    setFilterValorMin('');
    setFilterValorMax('');
    setFilterUf('');
    setFilterStatus('');
    setFilterDataInicio('');
    setFilterDataFim('');
    setSortField('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  const hasActiveFilters =
    search ||
    filterTipoTese ||
    filterRecuperabilidade ||
    filterValorMin ||
    filterValorMax ||
    filterUf ||
    filterStatus ||
    filterDataInicio ||
    filterDataFim;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <Link to="/carteiras" className="font-medium text-indigo-600 hover:text-indigo-800">
          Carteiras
        </Link>
        <span>/</span>
        {carteiraId && (
          <>
            <Link
              to={`/carteiras/${carteiraId}/casos`}
              className="font-medium text-indigo-600 hover:text-indigo-800"
            >
              Casos
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900">{casoNome || 'Processos'}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">
        Processos {casoNome ? `- ${casoNome}` : ''}
      </h1>

      {/* Filters panel */}
      <div className="rounded-lg border bg-white shadow-sm">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filtros
            {hasActiveFilters && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                !
              </span>
            )}
          </span>
          <svg
            className={cn('h-4 w-4 transition-transform', filtersOpen && 'rotate-180')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {filtersOpen && (
          <div className="border-t px-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Busca textual */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Busca</label>
                <input
                  type="text"
                  placeholder="CNJ, partes, comarca..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className={inputClass}
                />
              </div>

              {/* Tipo de tese */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Tese</label>
                <select
                  value={filterTipoTese}
                  onChange={e => {
                    setFilterTipoTese(e.target.value);
                    setPage(1);
                  }}
                  className={inputClass}
                >
                  <option value="">Todos</option>
                  {TIPO_TESE_OPTIONS.map(t => (
                    <option key={t} value={t}>
                      {t.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recuperabilidade */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Recuperabilidade</label>
                <select
                  value={filterRecuperabilidade}
                  onChange={e => {
                    setFilterRecuperabilidade(e.target.value);
                    setPage(1);
                  }}
                  className={inputClass}
                >
                  <option value="">Todos</option>
                  {RECUPERABILIDADE_OPTIONS.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Faixa de valor */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Valor minimo</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="R$ 0,00"
                  value={filterValorMin}
                  onChange={e => {
                    setFilterValorMin(e.target.value);
                    setPage(1);
                  }}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Valor maximo</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="R$ 0,00"
                  value={filterValorMax}
                  onChange={e => {
                    setFilterValorMax(e.target.value);
                    setPage(1);
                  }}
                  className={inputClass}
                />
              </div>

              {/* UF / Comarca */}
              <div>
                <label className="block text-sm font-medium text-gray-700">UF</label>
                <input
                  type="text"
                  placeholder="Ex: SP, RJ..."
                  value={filterUf}
                  onChange={e => {
                    setFilterUf(e.target.value);
                    setPage(1);
                  }}
                  className={inputClass}
                  maxLength={2}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={filterStatus}
                  onChange={e => {
                    setFilterStatus(e.target.value);
                    setPage(1);
                  }}
                  className={inputClass}
                >
                  <option value="">Todos</option>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Periodo (data distribuicao) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Data inicio</label>
                <input
                  type="date"
                  value={filterDataInicio}
                  onChange={e => {
                    setFilterDataInicio(e.target.value);
                    setPage(1);
                  }}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Data fim</label>
                <input
                  type="date"
                  value={filterDataFim}
                  onChange={e => {
                    setFilterDataFim(e.target.value);
                    setPage(1);
                  }}
                  className={inputClass}
                />
              </div>

              {/* Ordenacao */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Ordenar por</label>
                <select
                  value={sortField}
                  onChange={e => {
                    setSortField(e.target.value);
                    setPage(1);
                  }}
                  className={inputClass}
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Ordem</label>
                <select
                  value={sortOrder}
                  onChange={e => {
                    setSortOrder(e.target.value);
                    setPage(1);
                  }}
                  className={inputClass}
                >
                  <option value="desc">Decrescente</option>
                  <option value="asc">Crescente</option>
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : processos.length === 0 ? (
        <EmptyState
          title="Nenhum processo"
          description={
            hasActiveFilters
              ? 'Nenhum resultado para os filtros aplicados'
              : 'Nenhum processo encontrado neste caso'
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Numero CNJ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Tipo Tese
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Recuperabilidade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Valor Causa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    UF
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                    Inc.
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {processos.map(processo => (
                  <tr key={processo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">
                      <Link
                        to={`/processos/${processo.id}`}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {processo.numero_cnj}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {processo.tipo_tese ? (
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {processo.tipo_tese.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {processo.recuperabilidade ? (
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                            recuperabilidadeBadge(processo.recuperabilidade)
                          )}
                        >
                          {processo.recuperabilidade}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatCurrency(processo.valor_causa)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{processo.uf || '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          statusBadge(processo.status)
                        )}
                      >
                        {processo.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {processo.is_incidental && (
                        <span
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700"
                          title="Incidental"
                        >
                          I
                        </span>
                      )}
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
