import { useState, useEffect, useCallback } from 'react';
import { Eye, Download, Link2, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import SearchableSelect from '@/components/SearchableSelect';

function formatSize(bytes) {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

const typeBadgeClass = {
  html: 'bg-blue-100 text-blue-700',
  pdf: 'bg-red-100 text-red-700',
  md: 'bg-slate-100 text-slate-700',
};

function VincularModal({ open, documento, onClose, onVincular }) {
  const [processos, setProcessos] = useState([]);
  const [selectedProcessoId, setSelectedProcessoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setSelectedProcessoId('');
    setError(null);
    setLoading(true);
    api
      .get('/processos', { params: { per_page: 100 } })
      .then(({ data }) => setProcessos(data.data || []))
      .catch(err => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!selectedProcessoId) {
      setError('Selecione um processo');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onVincular(documento.id, selectedProcessoId);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Vincular a Processo</h2>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <LoadingSpinner className="py-8" />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Processo</label>
              <SearchableSelect
                value={selectedProcessoId}
                onChange={setSelectedProcessoId}
                options={processos}
                valueKey="id"
                labelKey="numero_cnj"
                placeholder="Selecione um processo..."
                searchPlaceholder="Buscar por numero CNJ..."
                renderOption={p => (
                  <div>
                    <span className="font-medium">{p.numero_cnj}</span>
                    {p.caso_nome && (
                      <span className="ml-2 text-xs text-slate-400">{p.caso_nome}</span>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !selectedProcessoId}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Vinculando...' : 'Vincular'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function PreviewModal({ doc, url, content, blobUrl, loading, onClose }) {
  useEffect(() => {
    if (!doc) return;
    const handleKeyDown = e => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [doc, onClose]);

  if (!doc) return null;

  const isPdf = doc.file_type === 'pdf';
  const title = doc.titulo || doc.filename;
  const openUrl = blobUrl || url;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60" onClick={onClose}>
      {/* Barra superior */}
      <div
        className="flex items-center justify-between bg-white px-4 py-3 shadow-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex min-w-0 items-center gap-3">
          <svg
            className="h-5 w-5 shrink-0 text-slate-400"
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
          <h3 className="truncate text-sm font-semibold text-slate-900">{title}</h3>
          <span
            className={cn(
              'inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold uppercase',
              typeBadgeClass[doc.file_type] || 'bg-slate-100 text-slate-700'
            )}
          >
            {doc.file_type}
          </span>
        </div>
        <div className="ml-4 flex shrink-0 items-center gap-2">
          {openUrl && (
            <a
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
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
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
              Abrir em nova aba
            </a>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Conteudo */}
      <div className="flex-1 overflow-hidden p-2" onClick={e => e.stopPropagation()}>
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : content && !isPdf ? (
          <iframe
            srcDoc={content}
            title={title}
            className="h-full w-full rounded-lg bg-white"
            sandbox="allow-same-origin"
          />
        ) : url ? (
          <iframe
            src={url}
            title={title}
            className="h-full w-full rounded-lg bg-white"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-400">Nao foi possivel carregar o preview.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState('');
  const [semProcesso, setSemProcesso] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [vincularDoc, setVincularDoc] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchDocumentos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: 20 };
      if (search) params.search = search;
      if (fileType) params.file_type = fileType;
      if (semProcesso) params.sem_processo = true;
      const { data } = await api.get('/documentos', { params });
      setDocumentos(data.data || []);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, fileType, semProcesso]);

  useEffect(() => {
    fetchDocumentos();
  }, [fetchDocumentos]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/documentos/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchDocumentos();
    } catch (err) {
      alert('Erro ao excluir: ' + (err.response?.data?.error || err.message));
      setDeleteConfirm(null);
    }
  };

  const handlePreview = async doc => {
    setPreviewDoc(doc);
    setPreviewUrl(null);
    setPreviewContent(null);
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
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
            const blob = new Blob([html], { type: 'text/html' });
            setPreviewBlobUrl(URL.createObjectURL(blob));
          } catch {
            // fallback: usa URL direta no iframe
          }
        }
      }
    } catch (err) {
      alert('Erro ao gerar preview: ' + (err.response?.data?.error || err.message));
      setPreviewDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = doc => {
    window.open(`/api/download/${doc.id}`, '_blank');
  };

  const handleVincular = async (docId, processoId) => {
    await api.put(`/documentos/${docId}`, { processo_id: processoId });
    fetchDocumentos();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Documentos</h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-full max-w-sm">
          <label className="block text-sm font-medium text-slate-700">Buscar</label>
          <input
            type="text"
            placeholder="Buscar por titulo ou filename..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="w-40">
          <label className="block text-sm font-medium text-slate-700">Tipo</label>
          <select
            value={fileType}
            onChange={e => {
              setFileType(e.target.value);
              setPage(1);
            }}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Todos</option>
            <option value="html">HTML</option>
            <option value="pdf">PDF</option>
            <option value="md">Markdown</option>
          </select>
        </div>

        <div className="flex items-center gap-2 pb-0.5">
          <input
            type="checkbox"
            id="sem-processo"
            checked={semProcesso}
            onChange={e => {
              setSemProcesso(e.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="sem-processo" className="text-sm text-slate-700">
            Sem processo vinculado
          </label>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : documentos.length === 0 ? (
        <EmptyState
          title="Nenhum documento"
          description={
            search || fileType || semProcesso
              ? 'Nenhum resultado para os filtros aplicados'
              : 'Nenhum documento encontrado no sistema'
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Titulo/Filename
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Processo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tamanho
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documentos.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {doc.titulo || doc.filename}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wider',
                          typeBadgeClass[doc.file_type] || 'bg-slate-100 text-slate-700'
                        )}
                      >
                        {doc.file_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {doc.processo_numero_cnj ? (
                        doc.processo_numero_cnj
                      ) : (
                        <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                          Sem processo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatSize(doc.tamanho)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handlePreview(doc)}
                          className="group relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Eye className="h-[18px] w-[18px]" />
                          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                            Preview
                          </span>
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="group relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Download className="h-[18px] w-[18px]" />
                          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                            Download
                          </span>
                        </button>
                        <button
                          onClick={() => setVincularDoc(doc)}
                          className="group relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Link2 className="h-[18px] w-[18px]" />
                          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                            Vincular
                          </span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(doc)}
                          className="group relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-[18px] w-[18px]" />
                          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                            Excluir
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <VincularModal
        open={!!vincularDoc}
        documento={vincularDoc}
        onClose={() => setVincularDoc(null)}
        onVincular={handleVincular}
      />

      <PreviewModal
        doc={previewDoc}
        url={previewUrl}
        content={previewContent}
        blobUrl={previewBlobUrl}
        loading={previewLoading}
        onClose={() => {
          setPreviewDoc(null);
          if (previewBlobUrl) {
            URL.revokeObjectURL(previewBlobUrl);
            setPreviewBlobUrl(null);
          }
        }}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Excluir Documento"
        message={`Deseja excluir o documento "${deleteConfirm?.titulo || deleteConfirm?.filename}"? Esta acao nao pode ser desfeita.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
