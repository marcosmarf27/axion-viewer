import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

const recuperabilidadeColors = {
  Alta: 'bg-[rgba(19,115,51,0.08)] text-[#137333]',
  Potencial: 'bg-[rgba(176,96,0,0.08)] text-[#b06000]',
  Critica: 'bg-[#fff3e0] text-[#e65100]',
  Indefinida: 'bg-[rgba(95,99,104,0.08)] text-[#5f6368]',
  Nenhuma: 'bg-[rgba(197,34,31,0.08)] text-[#c5221f]',
};

const teseColors = {
  NPL: 'bg-[rgba(25,103,210,0.08)] text-[#1967d2]',
  RJ: 'bg-[rgba(25,103,210,0.08)] text-[#1967d2]',
  Divida_Ativa: 'bg-[rgba(25,103,210,0.08)] text-[#1967d2]',
  Litigio: 'bg-[rgba(25,103,210,0.08)] text-[#1967d2]',
};

function formatCurrency(value) {
  if (value == null) return '-';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function Badge({ children, colorClass }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
      {children}
    </span>
  );
}

function DetailField({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-[var(--color-text)]">{value || '-'}</p>
    </div>
  );
}

function DownloadButton({ label, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] hover:text-white transition disabled:opacity-50"
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      {label}
    </button>
  );
}

export default function CaseDetailModal({ casoId, onClose }) {
  const [caso, setCaso] = useState(null);
  const [processos, setProcessos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Case details
      const { data: casoRes } = await api.get(`/casos/${casoId}`);
      setCaso(casoRes.data || casoRes);

      // 2. Processes for this case
      const { data: procRes } = await api.get('/processos', {
        params: { caso_id: casoId, per_page: 100 },
      });
      const procList = procRes.data || [];

      // 3. Documents for each process
      const processosWithDocs = await Promise.all(
        procList.map(async proc => {
          try {
            const { data: docsRes } = await api.get('/documentos', {
              params: { processo_id: proc.id },
            });
            return { ...proc, documentos: docsRes.data || [] };
          } catch {
            return { ...proc, documentos: [] };
          }
        })
      );

      setProcessos(processosWithDocs);
    } catch {
      setCaso(null);
      setProcessos([]);
    } finally {
      setLoading(false);
    }
  }, [casoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Close on Escape
  useEffect(() => {
    const handleKey = e => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleDownload = async docId => {
    setDownloadingId(docId);
    try {
      const { data } = await api.get(`/preview/${docId}`);
      if (data.signed_url) {
        window.open(data.signed_url, '_blank');
      }
    } catch {
      alert('Erro ao baixar documento');
    } finally {
      setDownloadingId(null);
    }
  };

  // Find consolidated report (document linked to case, not to a specific process)
  const consolidatedDocs = caso
    ? processos
        .flatMap(p => p.documentos)
        .filter(d => d.caso_id === casoId && !d.processo_id)
    : [];

  // If no unlinked docs, show all docs from all processes as consolidated
  const allDocs = processos.flatMap(p => p.documentos);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[5vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl animate-[fadeInUp_0.3s_ease-out] rounded-xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
          </div>
        ) : !caso ? (
          <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">
            Caso nao encontrado.
            <button onClick={onClose} className="ml-2 font-medium text-[var(--color-accent)]">
              Fechar
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[var(--color-border-subtle)] px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">{caso.nome}</h2>
                <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                  {caso.devedor || '-'}
                  {caso.cnpj_devedor && ` · ${caso.cnpj_devedor}`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-[var(--color-text-subtle)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-text)]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              {/* Details grid */}
              <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <DetailField label="Credor" value={caso.credor} />
                <DetailField
                  label="Tese"
                  value={
                    caso.tese ? (
                      <Badge colorClass={teseColors[caso.tese] || 'bg-[rgba(95,99,104,0.08)] text-[#5f6368]'}>
                        {caso.tese}
                      </Badge>
                    ) : (
                      '-'
                    )
                  }
                />
                <DetailField
                  label="Recuperabilidade"
                  value={
                    caso.recuperabilidade ? (
                      <Badge
                        colorClass={
                          recuperabilidadeColors[caso.recuperabilidade] ||
                          'bg-[rgba(95,99,104,0.08)] text-[#5f6368]'
                        }
                      >
                        {caso.recuperabilidade}
                      </Badge>
                    ) : (
                      '-'
                    )
                  }
                />
                <DetailField label="Valor Total" value={formatCurrency(caso.valor_total)} />
                <DetailField label="UF" value={caso.uf} />
                <DetailField label="Data Analise" value={formatDate(caso.data_analise || caso.updated_at)} />
              </div>

              {/* Consolidated report */}
              {(consolidatedDocs.length > 0 || allDocs.length > 0) && (
                <div className="mb-6 rounded-md border border-[rgba(139,105,20,0.25)] bg-[rgba(139,105,20,0.08)] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-[var(--color-accent-gold)]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                      <span className="text-sm font-semibold text-[var(--color-accent-gold)]">
                        Relatorio Consolidado do Caso
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {(consolidatedDocs.length > 0 ? consolidatedDocs : allDocs)
                        .slice(0, 2)
                        .map(doc => (
                          <DownloadButton
                            key={doc.id}
                            label={doc.file_type?.toUpperCase() || 'DOC'}
                            onClick={() => handleDownload(doc.id)}
                            loading={downloadingId === doc.id}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Processes list */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
                  Relatorios por Processo ({processos.length})
                </h3>
                <div className="space-y-3">
                  {processos.map(proc => (
                    <div
                      key={proc.id}
                      className="rounded-lg border border-[var(--color-border-subtle)] bg-white p-4"
                    >
                      {/* Process header */}
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[var(--color-text)]">
                              CNJ: {proc.numero_cnj || '-'}
                            </p>
                            {proc.is_incidental && (
                              <Badge colorClass="bg-[rgba(103,58,183,0.08)] text-[#673ab7]">
                                Incidental
                              </Badge>
                            )}
                            {proc.recuperabilidade && (
                              <Badge
                                colorClass={
                                  recuperabilidadeColors[proc.recuperabilidade] ||
                                  'bg-[rgba(95,99,104,0.08)] text-[#5f6368]'
                                }
                              >
                                {proc.recuperabilidade}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                            {proc.tipo_acao || '-'}
                          </p>
                        </div>
                      </div>

                      {/* Process info grid */}
                      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
                            Polo Ativo
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--color-text)]">
                            {proc.polo_ativo || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
                            Polo Passivo
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--color-text)]">
                            {proc.polo_passivo || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
                            Valor
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--color-text)]">
                            {formatCurrency(proc.valor_causa || proc.valor_divida)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-subtle)]">
                            Tribunal / Vara
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--color-text)]">
                            {[proc.tribunal, proc.vara].filter(Boolean).join(' / ') || '-'}
                          </p>
                        </div>
                      </div>

                      {/* Download buttons */}
                      {proc.documentos && proc.documentos.length > 0 && (
                        <div className="flex gap-2">
                          {proc.documentos.map(doc => (
                            <DownloadButton
                              key={doc.id}
                              label={doc.file_type?.toUpperCase() || 'DOC'}
                              onClick={() => handleDownload(doc.id)}
                              loading={downloadingId === doc.id}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {processos.length === 0 && (
                    <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">
                      Nenhum processo vinculado a este caso.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
