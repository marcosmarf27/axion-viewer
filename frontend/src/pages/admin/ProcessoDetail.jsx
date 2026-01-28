import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Link2, Eye, Download } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';

const statusColors = {
  ativo: 'bg-green-100 text-green-700',
  suspenso: 'bg-yellow-100 text-yellow-700',
  arquivado: 'bg-slate-100 text-slate-700',
  encerrado: 'bg-red-100 text-red-700',
};

const recuperabilidadeColors = {
  Alta: 'bg-green-100 text-green-700',
  Potencial: 'bg-[rgba(26,54,93,0.08)] text-[var(--color-accent)]',
  Critica: 'bg-red-100 text-red-700',
  Indefinida: 'bg-slate-100 text-slate-600',
  Nenhuma: 'bg-slate-200 text-slate-800',
};

const typeBadgeClass = {
  html: 'bg-blue-100 text-blue-700',
  pdf: 'bg-red-100 text-red-700',
  md: 'bg-slate-100 text-slate-700',
};

function Badge({ children, colorClass }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', colorClass)}>
      {children}
    </span>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {title && <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>}
      {children}
    </div>
  );
}

function FieldItem({ label, value }) {
  return (
    <div>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value || '-'}</dd>
    </div>
  );
}

function formatCurrency(value) {
  if (value == null) return '-';
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function VincularDocumentoModal({ open, processoId, onClose, onVinculado }) {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vinculando, setVinculando] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setSearchTerm('');
    api
      .get('/documentos', { params: { exclude_processo_id: processoId, per_page: 100 } })
      .then(({ data }) => {
        setDocumentos(data.data || data || []);
      })
      .catch(err => {
        setError(err.response?.data?.error || err.message);
      })
      .finally(() => setLoading(false));
  }, [open, processoId]);

  if (!open) return null;

  const handleVincular = async doc => {
    const hasOtherProcesso = doc.processo_numero_cnj;
    if (
      hasOtherProcesso &&
      !window.confirm(
        `Este documento ja esta vinculado ao processo "${doc.processo_numero_cnj}". Deseja mover para este processo?`
      )
    ) {
      return;
    }
    setVinculando(doc.id);
    try {
      await api.put(`/documentos/${doc.id}`, { processo_id: processoId });
      setDocumentos(prev => prev.filter(d => d.id !== doc.id));
      onVinculado();
    } catch (err) {
      alert('Erro ao vincular: ' + (err.response?.data?.error || err.message));
    } finally {
      setVinculando(null);
    }
  };

  const filteredDocs = documentos.filter(doc => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = (doc.title || doc.filename || '').toLowerCase();
    const type = (doc.file_type || '').toLowerCase();
    return name.includes(term) || type.includes(term);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Link2 className="h-5 w-5 text-[var(--color-accent)]" />
          Vincular Documento
        </h2>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <LoadingSpinner className="py-8" />
        ) : documentos.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Nenhum documento disponivel para vincular.
          </p>
        ) : (
          <>
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar documento por nome ou tipo..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {filteredDocs.length} documento(s) disponivel(is)
              </p>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {filteredDocs.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {doc.title || doc.filename}
                    </p>
                    <p className="text-xs text-slate-500">
                      {doc.file_type || 'Documento'} — {formatDate(doc.created_at)}
                    </p>
                    {doc.processo_numero_cnj && (
                      <p className="mt-0.5 text-xs">
                        <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                          Processo: {doc.processo_numero_cnj}
                        </span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleVincular(doc)}
                    disabled={vinculando === doc.id}
                    className="ml-3 shrink-0 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
                  >
                    {vinculando === doc.id ? 'Vinculando...' : 'Vincular'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Fechar
          </button>
        </div>
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
  const title = doc.title || doc.filename;
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

export default function ProcessoDetail() {
  const { id } = useParams();
  const [processo, setProcesso] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vincularOpen, setVincularOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchProcesso = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/processos/${id}`);
      setProcesso(data.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentos = async () => {
    setDocsLoading(true);
    try {
      const { data } = await api.get('/documentos', {
        params: { processo_id: id },
      });
      setDocumentos(data.data || data || []);
    } catch {
      setDocumentos([]);
    } finally {
      setDocsLoading(false);
    }
  };

  const handlePreview = useCallback(
    async doc => {
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
    },
    [previewBlobUrl]
  );

  const handleDownload = doc => {
    window.open(`/api/download/${doc.id}`, '_blank');
  };

  useEffect(() => {
    fetchProcesso();
    fetchDocumentos();
  }, [id]);

  if (loading) {
    return <LoadingSpinner className="py-20" size="lg" />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/processos"
          className="inline-flex items-center text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
        >
          &larr; Voltar para Processos
        </Link>
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!processo) return null;

  const incidentais = processo.processos_incidentais || [];

  return (
    <div className="space-y-6">
      {/* Link voltar */}
      <Link
        to="/admin/processos"
        className="inline-flex items-center text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
      >
        &larr; Voltar para Processos
      </Link>

      {/* Header */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{processo.numero_cnj}</h1>
          <Badge colorClass={statusColors[processo.status] || 'bg-slate-100 text-slate-700'}>
            {processo.status}
          </Badge>
          {processo.is_incidental && (
            <Badge colorClass="bg-purple-100 text-purple-700">Incidental</Badge>
          )}
        </div>
      </Card>

      {/* Dados gerais */}
      <Card title="Dados Gerais">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <FieldItem label="Tipo de Tese" value={processo.tipo_tese} />
          <FieldItem label="Tipo de Acao" value={processo.tipo_acao} />
          <FieldItem
            label="Recuperabilidade"
            value={
              processo.recuperabilidade ? (
                <Badge
                  colorClass={
                    recuperabilidadeColors[processo.recuperabilidade] ||
                    'bg-slate-100 text-slate-600'
                  }
                >
                  {processo.recuperabilidade}
                </Badge>
              ) : (
                '-'
              )
            }
          />
          <FieldItem label="Valor da Causa" value={formatCurrency(processo.valor_causa)} />
          <FieldItem label="Valor da Divida" value={formatCurrency(processo.valor_divida)} />
          <FieldItem label="Valor Atualizado" value={formatCurrency(processo.valor_atualizado)} />
          <FieldItem label="Polo Ativo" value={processo.polo_ativo} />
          <FieldItem label="Polo Passivo" value={processo.polo_passivo} />
          <FieldItem label="Comarca" value={processo.comarca} />
          <FieldItem label="Vara" value={processo.vara} />
          <FieldItem label="Tribunal" value={processo.tribunal} />
          <FieldItem label="UF" value={processo.uf} />
          <FieldItem label="Fase Processual" value={processo.fase_processual} />
          <FieldItem label="Data de Distribuicao" value={formatDate(processo.data_distribuicao)} />
          <FieldItem label="Ultima Movimentacao" value={processo.ultima_movimentacao} />
          <FieldItem
            label="Data Ultima Movimentacao"
            value={formatDate(processo.data_ultima_movimentacao)}
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <FieldItem label="Observacoes" value={processo.observacoes} />
          </div>
        </dl>
      </Card>

      {/* Processo pai */}
      {processo.processo_pai && (
        <Card title="Processo Pai">
          <p className="text-sm text-slate-700">
            Este processo e incidental ao processo principal:{' '}
            <Link
              to={`/admin/processos/${processo.processo_pai.id}`}
              className="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
            >
              {processo.processo_pai.numero_cnj || processo.processo_pai.id}
            </Link>
          </p>
        </Card>
      )}

      {/* Processos incidentais */}
      {incidentais.length > 0 && (
        <Card title="Processos Incidentais">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    CNJ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tipo de Acao
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {incidentais.map(child => (
                  <tr key={child.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      <Link
                        to={`/admin/processos/${child.id}`}
                        className="font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                      >
                        {child.numero_cnj}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{child.tipo_acao || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge
                        colorClass={statusColors[child.status] || 'bg-slate-100 text-slate-700'}
                      >
                        {child.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Documentos vinculados */}
      <Card title="Documentos Vinculados">
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setVincularOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            <Link2 className="h-4 w-4" />
            Vincular Documento
          </button>
        </div>

        {docsLoading ? (
          <LoadingSpinner className="py-8" />
        ) : documentos.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">
            Nenhum documento vinculado a este processo.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Data
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
                      {doc.title || doc.filename}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{doc.file_type || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handlePreview(doc)}
                          title="Preview"
                          aria-label="Preview"
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)]"
                        >
                          <Eye className="h-[18px] w-[18px]" />
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          title="Download"
                          aria-label="Download"
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)]"
                        >
                          <Download className="h-[18px] w-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal vincular documento */}
      <VincularDocumentoModal
        open={vincularOpen}
        processoId={id}
        onClose={() => setVincularOpen(false)}
        onVinculado={fetchDocumentos}
      />

      {/* Modal preview */}
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
    </div>
  );
}
