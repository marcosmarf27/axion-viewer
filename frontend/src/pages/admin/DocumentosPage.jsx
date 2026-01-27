import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';

function formatSize(bytes) {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

const typeBadgeClass = {
  html: 'bg-blue-100 text-blue-700',
  pdf: 'bg-red-100 text-red-700',
  md: 'bg-gray-100 text-gray-700',
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
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Vincular a Processo</h2>

        {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <LoadingSpinner className="py-8" />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Processo</label>
              <select
                value={selectedProcessoId}
                onChange={e => setSelectedProcessoId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Selecione um processo...</option>
                {processos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.numero_cnj}
                    {p.caso_nome ? ` - ${p.caso_nome}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !selectedProcessoId}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
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
    try {
      const { data } = await api.get(`/preview/${doc.id}`);
      if (data.signed_url) {
        window.open(data.signed_url, '_blank');
      }
    } catch (err) {
      alert('Erro ao gerar preview: ' + (err.response?.data?.error || err.message));
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
        <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-full max-w-sm">
          <label className="block text-sm font-medium text-gray-700">Buscar</label>
          <input
            type="text"
            placeholder="Buscar por titulo ou filename..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="w-40">
          <label className="block text-sm font-medium text-gray-700">Tipo</label>
          <select
            value={fileType}
            onChange={e => {
              setFileType(e.target.value);
              setPage(1);
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="sem-processo" className="text-sm text-gray-700">
            Sem processo vinculado
          </label>
        </div>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

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
          <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Titulo/Filename
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Processo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Tamanho
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documentos.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {doc.titulo || doc.filename}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium uppercase',
                          typeBadgeClass[doc.file_type] || 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {doc.file_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {doc.processo_numero_cnj ? (
                        doc.processo_numero_cnj
                      ) : (
                        <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                          Sem processo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatSize(doc.tamanho)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handlePreview(doc)}
                        className="mr-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="mr-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => setVincularDoc(doc)}
                        className="mr-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Vincular
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(doc)}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Excluir
                      </button>
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
