import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

function MarkdownEditor() {
  const [markdown, setMarkdown] = useState(`# Exemplo de Documento

## Introdução
Este é um exemplo de documento em **Markdown**.

### Características
- Suporte a **negrito** e *itálico*
- Listas numeradas e não numeradas
- Links e imagens
- Tabelas e código

## Código de Exemplo
\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

## Conclusão
Use o editor para criar seus documentos!`);

  const [selectedTheme, setSelectedTheme] = useState('juridico');
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      const response = await axios.get('/api/themes');
      if (response.data.success) {
        setThemes(response.data.themes);
      }
    } catch (error) {
      console.error('Erro ao carregar temas:', error);
    }
  };

  const handleConvertToHTML = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await axios.post('/api/convert', {
        markdown: markdown,
        theme: selectedTheme,
      });

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: 'HTML gerado com sucesso!',
        });

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
      const response = await axios.post('/api/convert/pdf', {
        markdown: markdown,
        theme: selectedTheme,
      });

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: 'PDF gerado com sucesso!',
        });

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

  return (
    <div className="markdown-editor">
      <div className="editor-header">
        <h2>Editor de Markdown</h2>
        <div className="controls">
          <select
            value={selectedTheme}
            onChange={e => setSelectedTheme(e.target.value)}
            className="theme-select"
          >
            {themes.map(theme => (
              <option key={theme.name} value={theme.name}>
                {theme.name} - {theme.description}
              </option>
            ))}
          </select>

          <button onClick={handleConvertToHTML} disabled={loading} className="btn btn-primary">
            {loading ? 'Convertendo...' : 'Gerar HTML'}
          </button>

          <button onClick={handleConvertToPDF} disabled={loading} className="btn btn-secondary">
            {loading ? 'Convertendo...' : 'Gerar PDF'}
          </button>
        </div>
      </div>

      {message && <div className={`message ${message.type}`}>{message.text}</div>}

      <div className="editor-container">
        <div className="editor-pane">
          <h3>Markdown</h3>
          <textarea
            value={markdown}
            onChange={e => setMarkdown(e.target.value)}
            placeholder="Digite seu markdown aqui..."
            className="markdown-input"
          />
        </div>

        <div className="preview-pane">
          <h3>Preview</h3>
          <div className="markdown-preview">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarkdownEditor;
