import { useState } from 'react';
import './ApiDocs.css';

const API_BASE_URL =
  window.location.hostname === 'localhost' ? 'http://localhost:8000' : window.location.origin;

function ApiDocs() {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const endpoints = [
    {
      title: 'Converter Markdown para HTML',
      method: 'POST',
      path: '/api/convert',
      description: 'Converte texto Markdown para HTML com tema personalizado',
      example: `curl -X POST ${API_BASE_URL}/api/convert \\
  -H "Content-Type: application/json" \\
  -d '{
    "markdown": "# Relatório\\n\\n## Introdução\\n\\nEste é um teste.",
    "theme": "juridico"
  }'`,
    },
    {
      title: 'Converter Markdown para PDF',
      method: 'POST',
      path: '/api/convert/pdf',
      description: 'Converte texto Markdown diretamente para PDF',
      example: `curl -X POST ${API_BASE_URL}/api/convert/pdf \\
  -H "Content-Type: application/json" \\
  -d '{
    "markdown": "# Relatório PDF\\n\\n## Seção 1\\n\\nConteúdo...",
    "theme": "juridico"
  }'`,
    },
    {
      title: 'Upload de Arquivo para HTML',
      method: 'POST',
      path: '/api/convert/file',
      description: 'Faz upload de arquivo .md e converte para HTML',
      example: `curl -X POST ${API_BASE_URL}/api/convert/file \\
  -F "file=@documento.md" \\
  -F "theme=juridico"`,
    },
    {
      title: 'Upload de Arquivo para PDF',
      method: 'POST',
      path: '/api/convert/file/pdf',
      description: 'Faz upload de arquivo .md e converte para PDF',
      example: `curl -X POST ${API_BASE_URL}/api/convert/file/pdf \\
  -F "file=@documento.md" \\
  -F "theme=juridico"`,
    },
    {
      title: 'Gerar PDF de HTML Existente',
      method: 'GET',
      path: '/api/generate-pdf/{html_filename}',
      description: 'Converte um arquivo HTML já gerado para PDF',
      example: `curl -X GET ${API_BASE_URL}/api/generate-pdf/relatorio_20251103_185939.html`,
    },
    {
      title: 'Listar Temas Disponíveis',
      method: 'GET',
      path: '/api/themes',
      description: 'Retorna lista de temas com suas configurações',
      example: `curl -X GET ${API_BASE_URL}/api/themes`,
    },
    {
      title: 'Listar Arquivos Gerados',
      method: 'GET',
      path: '/api/files',
      description: 'Lista todos os arquivos HTML/PDF gerados',
      example: `curl -X GET ${API_BASE_URL}/api/files`,
    },
    {
      title: 'Download de Arquivo',
      method: 'GET',
      path: '/api/download/{filename}',
      description: 'Faz download de um arquivo gerado',
      example: `curl -X GET ${API_BASE_URL}/api/download/relatorio_20251103_185939.pdf -O`,
    },
    {
      title: 'Deletar Arquivo',
      method: 'DELETE',
      path: '/api/files/{filename}',
      description: 'Remove um arquivo gerado',
      example: `curl -X DELETE ${API_BASE_URL}/api/files/relatorio_20251103_185939.html`,
    },
  ];

  return (
    <div className="api-docs">
      <div className="docs-header">
        <h2>📖 Documentação da API</h2>
        <p>Exemplos de uso dos endpoints disponíveis</p>
      </div>

      <div className="endpoints-grid">
        {endpoints.map((endpoint, index) => (
          <div key={index} className="endpoint-card">
            <div className="endpoint-header">
              <span className={`method-badge method-${endpoint.method.toLowerCase()}`}>
                {endpoint.method}
              </span>
              <code className="endpoint-path">{endpoint.path}</code>
            </div>

            <h3>{endpoint.title}</h3>
            <p className="endpoint-description">{endpoint.description}</p>

            <div className="code-block">
              <div className="code-header">
                <span>Exemplo cURL</span>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(endpoint.example, index)}
                >
                  {copiedIndex === index ? '✓ Copiado!' : '📋 Copiar'}
                </button>
              </div>
              <pre>
                <code>{endpoint.example}</code>
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ApiDocs;
