import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '@/lib/api';
import { formatCurrency, formatDate, recuperabilidadeColors, teseColors } from '@/lib/formatters';
import Badge from '@/components/Badge';
import CaseDetailModal from './CaseDetailModal';

const TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'NPL', label: 'NPL' },
  { key: 'RJ', label: 'RJ' },
  { key: 'Divida_Ativa', label: 'Divida Ativa' },
];

function StatCard({ label, value, highlight, icon }) {
  return (
    <div
      className={`rounded-lg border p-5 ${
        highlight
          ? 'border-[rgba(139,105,20,0.25)] bg-[var(--color-accent-gold-subtle)]'
          : 'border-[var(--color-border-subtle)] bg-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            highlight
              ? 'bg-[rgba(139,105,20,0.12)] text-[var(--color-accent-gold)]'
              : 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
          }`}
        >
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
            {label}
          </p>
          <p
            className={`text-xl font-semibold ${
              highlight ? 'text-[var(--color-accent-gold)]' : 'text-[var(--color-text)]'
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente header ordenável
function SortableHeader({ field, label, currentSort, currentOrder, onSort }) {
  const isActive = currentSort === field;
  return (
    <th
      className="cursor-pointer px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-subtle)] select-none hover:text-[var(--color-text)]"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (
          <span className="text-[var(--color-accent)]">
            {currentOrder === 'asc' ? '▲' : '▼'}
          </span>
        )}
      </div>
    </th>
  );
}

export default function ClientPanel() {
  const { selectedCarteira, filters, search } = useOutletContext();

  const [stats, setStats] = useState(null);
  const [casos, setCasos] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedCasoId, setSelectedCasoId] = useState(null);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('data_analise');
  const [sortOrder, setSortOrder] = useState('desc');
  const [downloadingCasoId, setDownloadingCasoId] = useState(null);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleQuickDownload = async (e, casoId) => {
    e.stopPropagation();
    setDownloadingCasoId(casoId);
    try {
      // Buscar primeiro processo do caso
      const { data: procRes } = await api.get('/processos', {
        params: { caso_id: casoId, per_page: 1 },
      });
      const proc = procRes.data?.[0];
      if (!proc) {
        alert('Nenhum processo encontrado');
        return;
      }

      // Buscar primeiro documento do processo
      const { data: docsRes } = await api.get('/documentos', {
        params: { processo_id: proc.id, per_page: 1 },
      });
      const doc = docsRes.data?.[0];
      if (!doc) {
        alert('Nenhum documento encontrado');
        return;
      }

      // Obter URL de download
      const { data } = await api.get(`/preview/${doc.id}`, {
        params: { download: 'true' },
      });
      if (data.signed_url) {
        window.open(data.signed_url, '_blank');
      }
    } catch {
      alert('Erro ao baixar documento');
    } finally {
      setDownloadingCasoId(null);
    }
  };

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/dashboard/client');
      setStats(data.data || data);
    } catch {
      setStats(null);
    }
  }, []);

  // Quando filtro tese da sidebar muda, resetar tab para 'all'
  useEffect(() => {
    if (filters.tese) {
      setActiveTab('all');
    }
  }, [filters.tese]);

  // Fetch cases
  const fetchCasos = useCallback(async () => {
    if (!selectedCarteira?.id) return;
    setLoading(true);
    setError(null);
    try {
      // Filtro tese: sidebar tem prioridade sobre tab
      const teseParam = filters.tese || (activeTab !== 'all' ? activeTab : undefined);

      const params = {
        page,
        per_page: 20,
        carteira_id: selectedCarteira.id,
        sort_field: sortField,
        sort_order: sortOrder,
        ...(teseParam && { tese: teseParam }),
        ...(filters.recuperabilidade && { recuperabilidade: filters.recuperabilidade }),
        ...(filters.uf && { uf_principal: filters.uf }),
        ...(filters.periodoInicio && { data_analise_desde: filters.periodoInicio }),
        ...(filters.periodoFim && { data_analise_ate: filters.periodoFim }),
        ...(search && { search }),
      };
      const { data } = await api.get('/casos', { params });
      setCasos(data.data || []);
      setPagination(data.pagination || { page: 1, total_pages: 1, total: 0 });
    } catch {
      setCasos([]);
      setError('Erro ao carregar casos. Verifique sua conexao.');
    } finally {
      setLoading(false);
    }
  }, [selectedCarteira?.id, page, activeTab, filters, search, sortField, sortOrder]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setPage(1);
  }, [selectedCarteira?.id, activeTab, filters, search]);

  useEffect(() => {
    fetchCasos();
  }, [fetchCasos]);

  const carteiraStats = stats?.carteiras?.find(c => c.id === selectedCarteira?.id);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Carteira"
          value={selectedCarteira?.nome || '-'}
          highlight
          icon={
            <svg
              className="h-5 w-5"
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
          }
        />
        <StatCard
          label="Total Casos"
          value={carteiraStats?.qtd_casos ?? stats?.total_casos ?? 0}
          icon={
            <svg
              className="h-5 w-5"
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
          }
        />
        <StatCard
          label="Processos"
          value={carteiraStats?.qtd_processos ?? stats?.total_processos ?? 0}
          icon={
            <svg
              className="h-5 w-5"
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
          }
        />
        <StatCard
          label="Valor Total"
          value={formatCurrency(carteiraStats?.valor_total ?? 0)}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Tabs + Table */}
      <div className="rounded-lg border border-[var(--color-border-subtle)] bg-white">
        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border-subtle)]">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg)]">
                <SortableHeader
                  field="nome"
                  label="Caso / Devedor"
                  currentSort={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
                  Tese
                </th>
                <SortableHeader
                  field="recuperabilidade"
                  label="Recuperab."
                  currentSort={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="valor_total"
                  label="Valor"
                  currentSort={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
                  Processos
                </th>
                <SortableHeader
                  field="data_analise"
                  label="Analise"
                  currentSort={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-[var(--color-text-muted)]"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <p className="text-sm text-[#c5221f]">{error}</p>
                    <button
                      onClick={fetchCasos}
                      className="mt-2 rounded border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-accent-subtle)]"
                    >
                      Tentar novamente
                    </button>
                  </td>
                </tr>
              ) : casos.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-[var(--color-text-muted)]"
                  >
                    Nenhum caso encontrado.
                  </td>
                </tr>
              ) : (
                casos.map(caso => (
                  <tr
                    key={caso.id}
                    className="cursor-pointer transition hover:bg-[var(--color-accent-subtle)]"
                    onClick={() => setSelectedCasoId(caso.id)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-medium text-[var(--color-text)]">
                        {caso.nome}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        {caso.devedor_principal || '-'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        colorClass={
                          teseColors[caso.tese] || 'bg-[rgba(95,99,104,0.08)] text-[#5f6368]'
                        }
                      >
                        {caso.tese || '-'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        colorClass={
                          recuperabilidadeColors[caso.recuperabilidade] ||
                          'bg-[rgba(95,99,104,0.08)] text-[#5f6368]'
                        }
                      >
                        {caso.recuperabilidade || '-'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-[var(--color-text)]">
                      {formatCurrency(caso.valor_total)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                          />
                        </svg>
                        {caso.qtd_processos ?? 0}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[var(--color-text-muted)]">
                      {formatDate(caso.data_analise || caso.updated_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCasoId(caso.id);
                          }}
                          className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] hover:text-white transition"
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Ver
                        </button>
                        <button
                          onClick={(e) => handleQuickDownload(e, caso.id)}
                          disabled={downloadingCasoId === caso.id}
                          title="Baixar relatório"
                          className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:bg-[var(--color-accent-gold)] hover:border-[var(--color-accent-gold)] hover:text-white transition disabled:opacity-50"
                        >
                          {downloadingCasoId === caso.id ? (
                            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] px-5 py-3">
            <p className="text-xs text-[var(--color-text-subtle)]">
              Pagina {pagination.page} de {pagination.total_pages} ({pagination.total} casos)
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-accent-subtle)] disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                disabled={page >= pagination.total_pages}
                className="rounded border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-accent-subtle)] disabled:opacity-40"
              >
                Proximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Case Detail Modal */}
      {selectedCasoId && (
        <CaseDetailModal casoId={selectedCasoId} onClose={() => setSelectedCasoId(null)} />
      )}
    </div>
  );
}
