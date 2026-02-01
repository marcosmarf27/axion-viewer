import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatDate, recuperabilidadeColors, teseColors } from '@/lib/formatters';
import Badge from '@/components/Badge';

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

function formatPoloPassivo(poloPassivo) {
  if (!poloPassivo) return '-';
  const partes = poloPassivo.split(';').map(p => p.trim()).filter(Boolean);
  if (partes.length === 0) return '-';
  if (partes.length === 1) return partes[0];

  const primeiro = partes[0];
  const outros = partes.length - 1;

  return (
    <span className="group relative cursor-help">
      {primeiro}{' '}
      <span className="text-[var(--color-text-muted)]">
        + {outros} outro{outros > 1 ? 's' : ''}
      </span>
      <span className="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden w-64 rounded-md border border-[var(--color-border)] bg-white p-2 text-xs shadow-lg group-hover:block">
        {partes.map((p, i) => (
          <div key={i} className="py-0.5 text-[var(--color-text)]">{p}</div>
        ))}
      </span>
    </span>
  );
}

function DownloadButton({ label, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] hover:text-white transition disabled:opacity-50"
    >
      <svg
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
        />
      </svg>
      {label}
    </button>
  );
}

function DocumentPreviewModal({
  doc,
  content,
  url,
  loading: previewLoading,
  onClose: onPreviewClose,
}) {
  useEffect(() => {
    const handleKey = e => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onPreviewClose();
      }
    };
    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [onPreviewClose]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/70" onClick={onPreviewClose}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between bg-white px-5 py-3 shadow"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[var(--color-text)]">
            {doc?.titulo || doc?.file_name || 'Documento'}
          </span>
          {doc?.file_type && (
            <span className="rounded bg-[var(--color-accent-subtle)] px-2 py-0.5 text-[10px] font-medium uppercase text-[var(--color-accent)]">
              {doc.file_type}
            </span>
          )}
        </div>
        <button
          onClick={onPreviewClose}
          className="rounded-md p-1.5 text-[var(--color-text-subtle)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-text)]"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Content */}
      <div className="flex-1 p-4" onClick={e => e.stopPropagation()}>
        {previewLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
          </div>
        ) : content ? (
          <iframe
            srcDoc={content}
            title={doc?.titulo || 'Preview'}
            className="h-full w-full rounded-lg bg-white"
            sandbox="allow-same-origin"
          />
        ) : url ? (
          <iframe
            src={url}
            title={doc?.titulo || 'Preview'}
            className="h-full w-full rounded-lg bg-white"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white">
            Nao foi possivel carregar o preview.
          </div>
        )}
      </div>
    </div>
  );
}

export default function CaseDetailModal({ casoId, onClose }) {
  const [caso, setCaso] = useState(null);
  const [processos, setProcessos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
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
      setError('Erro ao carregar dados do caso. Verifique sua conexao.');
    } finally {
      setLoading(false);
    }
  }, [casoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Close on Escape (only if preview is not open)
  useEffect(() => {
    const handleKey = e => {
      if (e.key === 'Escape' && !previewDoc) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, previewDoc]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handlePreview = async doc => {
    setPreviewDoc(doc);
    setPreviewUrl(null);
    setPreviewContent(null);
    setPreviewLoading(true);
    try {
      const { data } = await api.get(`/preview/${doc.id}`);
      if (data.signed_url) {
        setPreviewUrl(data.signed_url);
        if (doc.file_type === 'html') {
          try {
            const response = await fetch(data.signed_url);
            const html = await response.text();
            setPreviewContent(html);
          } catch {
            // fallback: usa URL direta no iframe
          }
        }
      }
    } catch {
      alert('Erro ao gerar preview');
      setPreviewDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewDoc(null);
    setPreviewContent(null);
    setPreviewUrl(null);
  };

  const handleDownload = async docId => {
    setDownloadingId(docId);
    try {
      const { data } = await api.get(`/preview/${docId}`, {
        params: { download: 'true' },
      });
      if (data.signed_url) {
        window.open(data.signed_url, '_blank');
      }
    } catch {
      alert('Erro ao baixar documento');
    } finally {
      setDownloadingId(null);
    }
  };

  // Todos os documentos do caso (de todos os processos)
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
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-[#c5221f]">{error}</p>
            <div className="mt-3 flex justify-center gap-2">
              <button
                onClick={fetchData}
                className="rounded border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-accent-subtle)]"
              >
                Tentar novamente
              </button>
              <button
                onClick={onClose}
                className="rounded px-3 py-1.5 text-xs font-medium text-[var(--color-accent)]"
              >
                Fechar
              </button>
            </div>
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
                  {caso.devedor_principal || '-'}
                  {caso.cnpj_cpf_devedor && ` · ${caso.cnpj_cpf_devedor}`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-[var(--color-text-subtle)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-text)]"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              {/* Details grid */}
              <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <DetailField label="Credor" value={caso.credor_principal} />
                <DetailField
                  label="Tese"
                  value={
                    caso.tese ? (
                      <Badge
                        colorClass={
                          teseColors[caso.tese] || 'bg-[rgba(95,99,104,0.08)] text-[#5f6368]'
                        }
                      >
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
                <DetailField label="Valor Ajuizado" value={formatCurrency(caso.valor_total)} />
                <DetailField label="UF" value={caso.uf_principal} />
                <DetailField
                  label="Data Analise"
                  value={formatDate(caso.data_analise || caso.updated_at)}
                />
              </div>

              {/* Relatorio do Caso */}
              {allDocs.length > 0 && (
                <div className="mb-6 rounded-lg border-2 border-[#d4a843] bg-[rgba(139,105,20,0.06)] p-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-6 w-6 text-[#d4a843]"
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
                      <span className="text-base font-bold text-[#d4a843]">
                        Relatorio do Caso
                      </span>
                    </div>
                    <div className="flex gap-3">
                      {(() => {
                        const htmlDoc = allDocs.find(d => d.file_type === 'html');
                        const pdfDoc = allDocs.find(d => d.file_type === 'pdf');
                        return (
                          <>
                            {/* Botoes HTML */}
                            <div className="flex gap-1">
                              <button
                                onClick={() => htmlDoc && handlePreview(htmlDoc)}
                                disabled={!htmlDoc}
                                title={htmlDoc ? 'Ver HTML' : 'HTML nao disponivel'}
                                className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition ${
                                  htmlDoc
                                    ? 'bg-[var(--color-accent)] text-white hover:opacity-90'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                }`}
                              >
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
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
                                Ver HTML
                              </button>
                              <button
                                onClick={() => htmlDoc && handleDownload(htmlDoc.id)}
                                disabled={!htmlDoc || downloadingId === htmlDoc?.id}
                                title={htmlDoc ? 'Baixar HTML' : 'HTML nao disponivel'}
                                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium border transition ${
                                  htmlDoc
                                    ? 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] hover:text-white'
                                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                }`}
                              >
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                                  />
                                </svg>
                                Baixar
                              </button>
                            </div>
                            {/* Botoes PDF */}
                            <div className="flex gap-1">
                              <button
                                onClick={() => pdfDoc && handlePreview(pdfDoc)}
                                disabled={!pdfDoc}
                                title={pdfDoc ? 'Ver PDF' : 'PDF nao disponivel'}
                                className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition ${
                                  pdfDoc
                                    ? 'bg-[#c5221f] text-white hover:opacity-90'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                }`}
                              >
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
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
                                Ver PDF
                              </button>
                              <button
                                onClick={() => pdfDoc && handleDownload(pdfDoc.id)}
                                disabled={!pdfDoc || downloadingId === pdfDoc?.id}
                                title={pdfDoc ? 'Baixar PDF' : 'PDF nao disponivel'}
                                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium border transition ${
                                  pdfDoc
                                    ? 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)] hover:bg-[#c5221f] hover:border-[#c5221f] hover:text-white'
                                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                }`}
                              >
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                                  />
                                </svg>
                                Baixar
                              </button>
                            </div>
                          </>
                        );
                      })()}
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
                            {formatPoloPassivo(proc.polo_passivo)}
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

                      {/* Document buttons */}
                      {proc.documentos && proc.documentos.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {proc.documentos.map(doc => (
                            <div key={doc.id} className="flex gap-1">
                              <button
                                onClick={() => handlePreview(doc)}
                                className="inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium border border-[var(--color-accent)] bg-[var(--color-accent)] text-white hover:opacity-90 transition"
                              >
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
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
                              <DownloadButton
                                label={doc.file_type?.toUpperCase() || 'DOC'}
                                onClick={() => handleDownload(doc.id)}
                                loading={downloadingId === doc.id}
                              />
                            </div>
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

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          doc={previewDoc}
          content={previewContent}
          url={previewUrl}
          loading={previewLoading}
          onClose={closePreview}
        />
      )}
    </div>
  );
}
