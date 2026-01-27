import { useState } from 'react';
import ApiDocs from './components/ApiDocs';
import FileManager from './components/FileManager';
import ThemeManager from './components/ThemeManager';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('docs');

  return (
    <div className="app">
      <header className="app-header">
        <h1>⚙️ Markdown API - Painel Administrativo</h1>
        <p>Gerencie conversões, arquivos e temas</p>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          📖 Documentação
        </button>
        <button
          className={`tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          📁 Arquivos
        </button>
        <button
          className={`tab ${activeTab === 'themes' ? 'active' : ''}`}
          onClick={() => setActiveTab('themes')}
        >
          🎨 Temas
        </button>
      </nav>

      <main className="content">
        {activeTab === 'docs' && <ApiDocs />}
        {activeTab === 'files' && <FileManager />}
        {activeTab === 'themes' && <ThemeManager />}
      </main>

      <footer className="app-footer">
        <p>API de Conversão Markdown v2.0.0 - Painel Administrativo</p>
      </footer>
    </div>
  );
}

export default App;
