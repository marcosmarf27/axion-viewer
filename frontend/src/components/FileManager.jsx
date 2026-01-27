import { useState, useEffect } from 'react';
import axios from 'axios';
import './FileManager.css';

function FileManager() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/files');
      if (response.data.success) {
        setFiles(response.data.files);
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError('Erro ao carregar arquivos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleDelete = async filename => {
    if (!confirm(`Tem certeza que deseja deletar ${filename}?`)) {
      return;
    }

    try {
      const response = await axios.delete(`/api/files/${filename}`);
      if (response.data.success) {
        loadFiles();
      } else {
        alert('Erro ao deletar: ' + response.data.error);
      }
    } catch (err) {
      alert('Erro ao deletar arquivo: ' + err.message);
    }
  };

  const handleDeleteAll = async () => {
    if (files.length === 0) {
      alert('Não há arquivos para deletar.');
      return;
    }

    if (
      !confirm(
        `⚠️ ATENÇÃO: Isso vai apagar TODOS os ${files.length} arquivo(s) gerados!\n\nTem certeza que deseja continuar?`
      )
    ) {
      return;
    }

    try {
      const response = await axios.delete('/api/files/all');
      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
        loadFiles();
      } else {
        let errorMsg = response.data.message || response.data.error || 'Erro desconhecido';
        if (response.data.errors && response.data.errors.length > 0) {
          errorMsg += '\n\nDetalhes:\n' + response.data.errors.join('\n');
        }
        alert('⚠️ ' + errorMsg);
        loadFiles();
      }
    } catch (err) {
      alert('❌ Erro ao deletar arquivos: ' + err.message);
    }
  };

  const formatFileSize = bytes => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = isoString => {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="file-manager">
        <div className="loading">Carregando arquivos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-manager">
        <div className="error">
          <p>{error}</p>
          <button onClick={loadFiles}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="file-manager">
      <div className="manager-header">
        <h2>📁 Arquivos Gerados</h2>
        <div className="header-actions">
          <span className="file-count">{files.length} arquivo(s)</span>
          <button onClick={loadFiles} className="refresh-btn">
            🔄 Atualizar
          </button>
          {files.length > 0 && (
            <button onClick={handleDeleteAll} className="delete-all-btn">
              🗑️ Limpar Tudo
            </button>
          )}
        </div>
      </div>

      {files.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum arquivo gerado ainda.</p>
          <p className="empty-hint">Use a API para converter documentos Markdown.</p>
        </div>
      ) : (
        <div className="files-table">
          <table>
            <thead>
              <tr>
                <th>Arquivo</th>
                <th>Tipo</th>
                <th>Tamanho</th>
                <th>Data de Criação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file, index) => (
                <tr key={index}>
                  <td className="filename-cell">
                    <span className={`file-icon ${file.type}`}>
                      {file.type === 'pdf' ? '📄' : '📝'}
                    </span>
                    <span className="filename">{file.filename}</span>
                  </td>
                  <td>
                    <span className={`type-badge ${file.type}`}>{file.type.toUpperCase()}</span>
                  </td>
                  <td>{formatFileSize(file.size)}</td>
                  <td>{formatDate(file.created_at)}</td>
                  <td className="actions-cell">
                    {file.preview_url && (
                      <a
                        href={file.preview_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-btn preview-btn"
                        title="Preview"
                      >
                        👁️
                      </a>
                    )}
                    <a
                      href={file.download_url}
                      className="action-btn download-btn"
                      title="Download"
                    >
                      ⬇️
                    </a>
                    <button
                      onClick={() => handleDelete(file.filename)}
                      className="action-btn delete-btn"
                      title="Deletar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FileManager;
