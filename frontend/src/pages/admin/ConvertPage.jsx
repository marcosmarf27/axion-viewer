import { useState, useEffect } from 'react';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import ReactMarkdown from 'react-markdown';

const DEFAULT_MARKDOWN = `# Exemplo de Documento

## Introducao
Este e um exemplo de documento em **Markdown**.

### Caracteristicas
- Suporte a **negrito** e *italico*
- Listas numeradas e nao numeradas
- Links e imagens
- Tabelas e codigo

## Codigo de Exemplo
\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

## Conclusao
Use o editor para criar seus documentos!`;

const INPUT_CLASS =
  'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]';
const BTN_PRIMARY =
  'rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50';
const BTN_SECONDARY =
  'rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50';

export default function ConvertPage() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [selectedTheme, setSelectedTheme] = useState('juridico');
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [processoId, setProcessoId] = useState('');
  const [title, setTitle] = useState('');
  const [processos, setProcessos] = useState([]);

  useEffect(() => {
    fetchThemes();
    fetchProcessos();
  }, []);

  const fetchThemes = async () => {
    try {
      const response = await api.get('/themes');
      if (response.data.success) {
        setThemes(response.data.themes);
      }
    } catch (error) {
      console.error('Erro ao carregar temas:', error);
    }
  };

  const fetchProcessos = async () => {
    try {
      const response = await api.get('/processos?per_page=100');
      setProcessos(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar processos:', error);
    }
  };

  const buildPayload = () => ({
    markdown,
    theme: selectedTheme,
    processo_id: processoId || undefined,
    title: title || undefined,
  });

  const handleConvertToHTML = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/convert', buildPayload());

      if (response.data.success) {
        setMessage({ type: 'success', text: 'HTML gerado com sucesso!' });
        const downloadUrl = response.data.download_url;
        window.open(downloadUrl, '_blank');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erro ao converter: ' + (error.response?.data?.error || error.message),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToPDF = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/convert/pdf', buildPayload());

      if (response.data.success) {
        setMessage({ type: 'success', text: 'PDF gerado com sucesso!' });
        const downloadUrl = response.data.pdf_download_url;
        window.open(downloadUrl, '_blank');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erro ao converter: ' + (error.response?.data?.error || error.message),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e, format) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('theme', selectedTheme);
    if (processoId) formData.append('processo_id', processoId);
    if (title) formData.append('title', title);

    const endpoint = format === 'pdf' ? '/convert/file/pdf' : '/convert/file';

    try {
      const response = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        const label = format === 'pdf' ? 'PDF' : 'HTML';
        setMessage({ type: 'success', text: `${label} gerado com sucesso!` });

        const downloadUrl =
          format === 'pdf' ? response.data.pdf_download_url : response.data.download_url;
        window.open(downloadUrl, '_blank');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erro ao converter arquivo: ' + (error.response?.data?.error || error.message),
      });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Converter Documento</h1>
        <p className="mt-1 text-sm text-slate-600">
          Converta documentos Markdown em HTML ou PDF formatados.
        </p>
      </div>

      {/* Top bar: controles */}
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Tema */}
          <div>
            <label htmlFor="theme-select" className="block text-sm font-medium text-slate-700">
              Tema
            </label>
            <select
              id="theme-select"
              value={selectedTheme}
              onChange={e => setSelectedTheme(e.target.value)}
              className={INPUT_CLASS}
            >
              {themes.map(theme => (
                <option key={theme.name} value={theme.name}>
                  {theme.name} - {theme.description}
                </option>
              ))}
            </select>
          </div>

          {/* Processo */}
          <div>
            <label htmlFor="processo-select" className="block text-sm font-medium text-slate-700">
              Processo
            </label>
            <select
              id="processo-select"
              value={processoId}
              onChange={e => setProcessoId(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Nenhum - documento avulso</option>
              {processos.map(proc => (
                <option key={proc.id} value={proc.id}>
                  {proc.numero_cnj}
                </option>
              ))}
            </select>
          </div>

          {/* Titulo */}
          <div>
            <label htmlFor="title-input" className="block text-sm font-medium text-slate-700">
              Titulo
            </label>
            <input
              id="title-input"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Titulo do documento (opcional)"
              className={INPUT_CLASS}
            />
          </div>

          {/* Upload de arquivo */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Upload .md</label>
            <div className="mt-1 flex gap-2">
              <label className={`${BTN_SECONDARY} cursor-pointer text-center`}>
                HTML
                <input
                  type="file"
                  accept=".md"
                  className="hidden"
                  onChange={e => handleFileUpload(e, 'html')}
                  disabled={loading}
                />
              </label>
              <label className={`${BTN_SECONDARY} cursor-pointer text-center`}>
                PDF
                <input
                  type="file"
                  accept=".md"
                  className="hidden"
                  onChange={e => handleFileUpload(e, 'pdf')}
                  disabled={loading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Botoes de conversao */}
        <div className="mt-4 flex items-center gap-3">
          <button onClick={handleConvertToHTML} disabled={loading} className={BTN_PRIMARY}>
            {loading ? 'Convertendo...' : 'Gerar HTML'}
          </button>
          <button onClick={handleConvertToPDF} disabled={loading} className={BTN_PRIMARY}>
            {loading ? 'Convertendo...' : 'Gerar PDF'}
          </button>
          {loading && <LoadingSpinner size="sm" />}
        </div>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Split pane: editor + preview */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left pane: textarea markdown */}
        <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
            <h3 className="text-sm font-medium text-slate-700">Markdown</h3>
          </div>
          <textarea
            value={markdown}
            onChange={e => setMarkdown(e.target.value)}
            placeholder="Digite seu markdown aqui..."
            className="flex-1 resize-none p-4 font-mono text-sm focus:outline-none"
            style={{ minHeight: '400px' }}
          />
        </div>

        {/* Right pane: preview */}
        <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
            <h3 className="text-sm font-medium text-slate-700">Preview</h3>
          </div>
          <div
            className="prose prose-sm max-w-none flex-1 overflow-auto p-4"
            style={{ minHeight: '400px' }}
          >
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
