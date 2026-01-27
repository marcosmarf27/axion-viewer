import { useState, useEffect } from 'react';
import axios from 'axios';

function FileUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('juridico');
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [dragActive, setDragActive] = useState(false);

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

  const handleDrag = e => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = e => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadHTML = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Por favor, selecione um arquivo' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('theme', selectedTheme);

    try {
      const response = await axios.post('/api/convert/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: 'Arquivo convertido com sucesso!',
        });

        window.open(response.data.download_url, '_blank');
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

  const handleUploadPDF = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Por favor, selecione um arquivo' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('theme', selectedTheme);

    try {
      const response = await axios.post('/api/convert/file/pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: 'PDF gerado com sucesso!',
        });

        window.open(response.data.pdf_download_url, '_blank');
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
    <div className="file-upload">
      <h2>Upload de Arquivo Markdown</h2>

      {message && <div className={`message ${message.type}`}>{message.text}</div>}

      <div
        className={`drop-zone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-input"
          accept=".md,.markdown,.txt"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <label htmlFor="file-input" className="drop-zone-label">
          <div className="drop-zone-icon">📁</div>
          {selectedFile ? (
            <div>
              <p>
                <strong>Arquivo selecionado:</strong>
              </p>
              <p>{selectedFile.name}</p>
              <p className="file-size">{(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          ) : (
            <div>
              <p>Arraste e solte um arquivo .md aqui</p>
              <p>ou clique para selecionar</p>
            </div>
          )}
        </label>
      </div>

      <div className="upload-controls">
        <div className="control-group">
          <label htmlFor="theme-select">Tema:</label>
          <select
            id="theme-select"
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
        </div>

        <div className="button-group">
          <button
            onClick={handleUploadHTML}
            disabled={loading || !selectedFile}
            className="btn btn-primary"
          >
            {loading ? 'Convertendo...' : 'Gerar HTML'}
          </button>

          <button
            onClick={handleUploadPDF}
            disabled={loading || !selectedFile}
            className="btn btn-secondary"
          >
            {loading ? 'Convertendo...' : 'Gerar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FileUpload;
