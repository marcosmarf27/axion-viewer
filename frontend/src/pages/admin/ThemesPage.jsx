import { useState, useEffect } from 'react';
import api from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function ThemesPage() {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [editedTheme, setEditedTheme] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [defaultTheme, setDefaultTheme] = useState(() => {
    return localStorage.getItem('defaultTheme') || 'juridico';
  });

  // Estados para criar novo tema
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTheme, setNewTheme] = useState({
    name: '',
    description: '',
    primary_color: '#0066CC',
    logo: '',
  });
  const [creating, setCreating] = useState(false);

  // Estado para excluir tema
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Estado para editar nome do tema
  const [editingName, setEditingName] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    loadThemes();
  }, []);

  useEffect(() => {
    if (selectedTheme) {
      setEditedTheme(JSON.parse(JSON.stringify(selectedTheme)));
    }
  }, [selectedTheme]);

  const showFeedback = (type, text, duration = 3000) => {
    setSaveMessage({ type, text });
    setTimeout(() => setSaveMessage(null), duration);
  };

  const loadThemes = async (preserveThemeName = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/themes');
      if (response.data.success) {
        setThemes(response.data.themes);
        if (response.data.themes.length > 0) {
          if (preserveThemeName) {
            const preservedTheme = response.data.themes.find(t => t.name === preserveThemeName);
            if (preservedTheme) {
              setSelectedTheme(preservedTheme);
              return;
            }
          }
          const savedDefault = localStorage.getItem('defaultTheme');
          if (savedDefault) {
            const defaultThemeObj = response.data.themes.find(t => t.name === savedDefault);
            if (defaultThemeObj) {
              setSelectedTheme(defaultThemeObj);
              return;
            }
          }
          setSelectedTheme(response.data.themes[0]);
        }
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError('Erro ao carregar temas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (colorKey, value) => {
    setEditedTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value,
      },
    }));
  };

  const handleBorderChange = (borderKey, value) => {
    setEditedTheme(prev => ({
      ...prev,
      styling: {
        ...prev.styling,
        borders: {
          ...prev.styling?.borders,
          [borderKey]: `${value}px`,
        },
      },
    }));
  };

  const handleGradientChange = (gradientKey, value) => {
    setEditedTheme(prev => ({
      ...prev,
      styling: {
        ...prev.styling,
        gradients: {
          ...prev.styling?.gradients,
          [gradientKey]: `${value}deg`,
        },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const currentThemeName = editedTheme.name;
      const response = await api.put(`/themes/${editedTheme.name}`, {
        colors: editedTheme.colors,
        styling: editedTheme.styling,
        fonts: editedTheme.fonts,
      });

      if (response.data.success) {
        showFeedback('success', 'Tema salvo com sucesso!');
        await loadThemes(currentThemeName);
      }
    } catch (err) {
      showFeedback('error', 'Erro ao salvar: ' + err.message, 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEditedTheme(JSON.parse(JSON.stringify(selectedTheme)));
    showFeedback('info', 'Alteracoes revertidas', 2000);
  };

  const hasChanges = () => {
    return JSON.stringify(editedTheme) !== JSON.stringify(selectedTheme);
  };

  const handleCreateTheme = async () => {
    if (!newTheme.name.trim()) {
      showFeedback('error', 'Nome do tema e obrigatorio');
      return;
    }

    setCreating(true);
    setSaveMessage(null);
    try {
      const themeName = newTheme.name.trim().toLowerCase().replace(/\s+/g, '-');
      const response = await api.post('/themes', {
        name: themeName,
        description: newTheme.description || `Tema ${newTheme.name}`,
        primary_color: newTheme.primary_color,
        logo: newTheme.logo,
      });

      if (response.data.success) {
        showFeedback('success', `Tema "${newTheme.name}" criado com sucesso!`);
        setShowCreateModal(false);
        setNewTheme({
          name: '',
          description: '',
          primary_color: '#0066CC',
          logo: '',
        });
        await loadThemes(themeName);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      showFeedback('error', `Erro ao criar tema: ${errorMsg}`, 5000);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTheme = async () => {
    if (!selectedTheme || selectedTheme.name === 'juridico') return;

    try {
      const deletedThemeName = selectedTheme.name;
      const response = await api.delete(`/themes/${selectedTheme.name}`);

      if (response.data.success) {
        showFeedback('success', `Tema "${deletedThemeName}" excluido!`);
        setShowDeleteConfirm(false);

        if (deletedThemeName === defaultTheme) {
          localStorage.setItem('defaultTheme', 'juridico');
          setDefaultTheme('juridico');
        }

        await loadThemes();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      showFeedback('error', `Erro ao excluir: ${errorMsg}`, 5000);
    }
  };

  const getDerivedColors = primaryColor => {
    const darken = (hex, factor) => {
      const color = hex.replace('#', '');
      const r = Math.floor(parseInt(color.substr(0, 2), 16) * (1 - factor));
      const g = Math.floor(parseInt(color.substr(2, 2), 16) * (1 - factor));
      const b = Math.floor(parseInt(color.substr(4, 2), 16) * (1 - factor));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };
    return {
      primary: primaryColor,
      dark: darken(primaryColor, 0.4),
      black_tone: darken(primaryColor, 0.7),
    };
  };

  const handleSetDefaultTheme = () => {
    if (selectedTheme) {
      localStorage.setItem('defaultTheme', selectedTheme.name);
      setDefaultTheme(selectedTheme.name);
      showFeedback('success', `"${selectedTheme.name}" definido como tema padrao!`);
    }
  };

  const startEditingName = () => {
    setNewThemeName(selectedTheme?.name || '');
    setEditingName(true);
  };

  const cancelEditingName = () => {
    setEditingName(false);
    setNewThemeName('');
  };

  const handleRenameTheme = async () => {
    if (!selectedTheme || !newThemeName.trim()) return;

    const cleanName = newThemeName.trim().toLowerCase().replace(/\s+/g, '-');

    if (cleanName === selectedTheme.name) {
      setEditingName(false);
      return;
    }

    setRenaming(true);
    try {
      const response = await api.patch(`/themes/${selectedTheme.name}/rename`, {
        new_name: cleanName,
      });

      if (response.data.success) {
        showFeedback('success', `Tema renomeado para "${cleanName}"!`);
        setEditingName(false);
        setNewThemeName('');

        if (selectedTheme.name === defaultTheme) {
          localStorage.setItem('defaultTheme', cleanName);
          setDefaultTheme(cleanName);
        }

        await loadThemes(cleanName);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      showFeedback('error', `Erro ao renomear: ${errorMsg}`, 5000);
    } finally {
      setRenaming(false);
    }
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => loadThemes()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const derivedColors = getDerivedColors(newTheme.primary_color);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Editor de Temas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Personalize cores, gradientes e bordas do seu tema
        </p>
      </div>

      {/* Feedback message */}
      {saveMessage && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            saveMessage.type === 'success'
              ? 'bg-green-50 text-green-700'
              : saveMessage.type === 'error'
                ? 'bg-red-50 text-red-700'
                : 'bg-blue-50 text-blue-700'
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Content: Sidebar + Editor */}
      <div className="flex gap-4">
        {/* Sidebar - Lista de Temas */}
        <div className="w-64 shrink-0 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Temas</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              + Novo Tema
            </button>
          </div>
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto p-2">
            {themes.map((theme, index) => (
              <button
                key={index}
                onClick={() => setSelectedTheme(theme)}
                className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  selectedTheme?.name === theme.name
                    ? 'bg-indigo-50 ring-1 ring-indigo-200'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex shrink-0 gap-1">
                  {theme.colors?.primary && (
                    <span
                      className="inline-block h-3 w-3 rounded-full border border-slate-200"
                      style={{ background: theme.colors.primary }}
                    />
                  )}
                  {theme.colors?.dark && (
                    <span
                      className="inline-block h-3 w-3 rounded-full border border-slate-200"
                      style={{ background: theme.colors.dark }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-slate-900">
                      {theme.name}
                    </span>
                    {theme.name === defaultTheme && (
                      <span className="shrink-0 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                        Padrao
                      </span>
                    )}
                  </div>
                  {theme.description && (
                    <p className="truncate text-xs text-slate-500">{theme.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor - Tema selecionado */}
        {editedTheme && (
          <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Editor Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
              <div className="flex items-center gap-2">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newThemeName}
                      onChange={e => setNewThemeName(e.target.value)}
                      className="mt-1 block w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Nome do tema"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameTheme();
                        if (e.key === 'Escape') cancelEditingName();
                      }}
                    />
                    <button
                      onClick={handleRenameTheme}
                      disabled={renaming || !newThemeName.trim()}
                      className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      title="Salvar nome"
                    >
                      {renaming ? '...' : 'OK'}
                    </button>
                    <button
                      onClick={cancelEditingName}
                      disabled={renaming}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                      title="Cancelar"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Editando: {editedTheme.name}
                    </h3>
                    {selectedTheme?.name !== 'juridico' && (
                      <button
                        onClick={startEditingName}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Editar nome do tema"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedTheme?.name !== 'juridico' && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Excluir
                  </button>
                )}
                <button
                  onClick={handleSetDefaultTheme}
                  disabled={selectedTheme?.name === defaultTheme}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {selectedTheme?.name === defaultTheme ? 'Tema Padrao' : 'Definir como Padrao'}
                </button>
                <button
                  onClick={handleReset}
                  disabled={!hasChanges() || saving}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Reverter
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges() || saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>

            {/* Editor Sections */}
            <div className="max-h-[calc(100vh-320px)] space-y-6 overflow-y-auto p-6">
              {/* Cores */}
              <section>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Cores
                </h4>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                  {Object.entries(editedTheme.colors || {}).map(([key, value]) => (
                    <div key={key} className="rounded-lg border p-3">
                      <label className="block text-xs font-medium text-slate-600">{key}</label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          type="color"
                          value={value.startsWith('rgba') ? '#000000' : value}
                          onChange={e => handleColorChange(key, e.target.value)}
                          disabled={value.startsWith('rgba')}
                          className="h-8 w-8 shrink-0 cursor-pointer rounded border border-slate-300"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={e => handleColorChange(key, e.target.value)}
                          className="block w-full rounded-lg border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Gradientes */}
              <section>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Gradientes
                </h4>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {Object.entries(editedTheme.styling?.gradients || {}).map(([key, value]) => {
                    const numValue = parseInt(value) || 135;
                    return (
                      <div key={key} className="rounded-lg border p-4">
                        <label className="block text-xs font-medium text-slate-600">{key}</label>
                        <div
                          className="mt-2 h-6 w-full rounded"
                          style={{
                            background: `linear-gradient(${value}, ${editedTheme.colors.primary} 0%, ${editedTheme.colors.dark} 50%, ${editedTheme.colors.black_tone} 100%)`,
                          }}
                        />
                        <div className="mt-2 flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={numValue}
                            onChange={e => handleGradientChange(key, e.target.value)}
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
                          />
                          <span className="shrink-0 text-xs font-medium text-slate-500">
                            {value}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Bordas */}
              <section>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Espessuras de Bordas
                </h4>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {Object.entries(editedTheme.styling?.borders || {}).map(([key, value]) => {
                    const numValue = parseInt(value) || 2;
                    return (
                      <div key={key} className="rounded-lg border p-4">
                        <label className="block text-xs font-medium text-slate-600">{key}</label>
                        <div
                          className="mt-2 w-full"
                          style={{
                            borderBottom: `${value} solid ${editedTheme.colors.primary}`,
                          }}
                        />
                        <div className="mt-2 flex items-center gap-3">
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={numValue}
                            onChange={e => handleBorderChange(key, e.target.value)}
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
                          />
                          <span className="shrink-0 text-xs font-medium text-slate-500">
                            {value}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Preview */}
              <section>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Preview do Tema
                </h4>
                <div className="overflow-hidden rounded-lg border">
                  {/* Preview Header */}
                  <div
                    className="px-6 py-4 text-white"
                    style={{
                      background: `linear-gradient(${editedTheme.styling?.gradients?.header_angle || '135deg'}, ${editedTheme.colors.primary} 0%, ${editedTheme.colors.dark} 50%, ${editedTheme.colors.black_tone} 100%)`,
                    }}
                  >
                    <h2 className="text-lg font-bold">Titulo do Documento</h2>
                    <p className="text-sm opacity-80">Subtitulo exemplo</p>
                  </div>

                  {/* Preview Content */}
                  <div className="space-y-3 p-6">
                    <h3
                      className="pb-1 text-base font-bold"
                      style={{
                        borderBottom: `${editedTheme.styling?.borders?.h1 || '3px'} solid ${editedTheme.colors.primary}`,
                        color: editedTheme.colors.dark,
                      }}
                    >
                      Titulo H1
                    </h3>

                    <h4
                      className="pb-1 text-sm font-semibold"
                      style={{
                        borderBottom: `${editedTheme.styling?.borders?.h2 || '2px'} solid ${editedTheme.colors.primary}`,
                        color: editedTheme.colors.dark,
                      }}
                    >
                      Titulo H2
                    </h4>

                    <div
                      className="rounded px-3 py-2 text-sm"
                      style={{
                        background: editedTheme.colors.light_danger_bg,
                        borderLeft: `${editedTheme.styling?.borders?.alert_boxes || '4px'} solid ${editedTheme.colors.danger}`,
                      }}
                    >
                      <strong style={{ color: editedTheme.colors.danger }}>Alerta Critico</strong>
                    </div>

                    <div
                      className="rounded px-3 py-2 text-sm"
                      style={{
                        background: editedTheme.colors.light_warning_bg,
                        borderLeft: `${editedTheme.styling?.borders?.alert_boxes || '4px'} solid ${editedTheme.colors.warning}`,
                      }}
                    >
                      <strong style={{ color: editedTheme.colors.warning }}>Alerta Medio</strong>
                    </div>

                    <div
                      className="rounded px-3 py-2 text-sm"
                      style={{
                        background: editedTheme.colors.light_success_bg,
                        borderLeft: `${editedTheme.styling?.borders?.alert_boxes || '4px'} solid ${editedTheme.colors.success}`,
                      }}
                    >
                      <strong style={{ color: editedTheme.colors.success }}>Alerta Baixo</strong>
                    </div>
                  </div>

                  {/* Preview Footer */}
                  <div
                    className="px-6 py-3 text-center text-sm text-white opacity-90"
                    style={{
                      background: `linear-gradient(${editedTheme.styling?.gradients?.footer_angle || '135deg'}, ${editedTheme.colors.primary} 0%, ${editedTheme.colors.dark} 50%, ${editedTheme.colors.black_tone} 100%)`,
                    }}
                  >
                    Rodape do Documento
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>

      {/* Modal Criar Novo Tema */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-white shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">Criar Novo Tema</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
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

            {/* Modal Body */}
            <div className="space-y-4 px-6 py-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nome do Tema *</label>
                <input
                  type="text"
                  value={newTheme.name}
                  onChange={e =>
                    setNewTheme(prev => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="ex: financeiro, medico, imobiliario"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Apenas letras, numeros e hifens. Sera convertido para minusculas.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Descricao</label>
                <input
                  type="text"
                  value={newTheme.description}
                  onChange={e =>
                    setNewTheme(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="ex: Tema para relatorios financeiros"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Cor Principal</label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="color"
                    value={newTheme.primary_color}
                    onChange={e =>
                      setNewTheme(prev => ({
                        ...prev,
                        primary_color: e.target.value,
                      }))
                    }
                    className="h-10 w-10 cursor-pointer rounded border border-slate-300"
                  />
                  <input
                    type="text"
                    value={newTheme.primary_color}
                    onChange={e =>
                      setNewTheme(prev => ({
                        ...prev,
                        primary_color: e.target.value,
                      }))
                    }
                    className="block w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Preview das cores derivadas */}
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Preview das Cores (geradas automaticamente)
                </label>
                <div className="mt-2 flex gap-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-6 w-6 rounded border border-slate-200"
                      style={{ background: derivedColors.primary }}
                    />
                    <span className="text-xs text-slate-600">Primary</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-6 w-6 rounded border border-slate-200"
                      style={{ background: derivedColors.dark }}
                    />
                    <span className="text-xs text-slate-600">Dark</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-6 w-6 rounded border border-slate-200"
                      style={{ background: derivedColors.black_tone }}
                    />
                    <span className="text-xs text-slate-600">Black Tone</span>
                  </div>
                </div>
                <div
                  className="mt-2 flex h-8 items-center justify-center rounded text-xs font-medium text-white"
                  style={{
                    background: `linear-gradient(135deg, ${derivedColors.primary} 0%, ${derivedColors.dark} 50%, ${derivedColors.black_tone} 100%)`,
                  }}
                >
                  Preview do Gradiente
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  URL do Logo (opcional)
                </label>
                <input
                  type="text"
                  value={newTheme.logo}
                  onChange={e =>
                    setNewTheme(prev => ({
                      ...prev,
                      logo: e.target.value,
                    }))
                  }
                  placeholder="https://exemplo.com/logo.png"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTheme}
                disabled={creating || !newTheme.name.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? 'Criando...' : 'Criar Tema'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ConfirmDialog para exclusao */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Confirmar Exclusao"
        message={`Tem certeza que deseja excluir o tema "${selectedTheme?.name}"? Esta acao nao pode ser desfeita.`}
        variant="danger"
        onConfirm={handleDeleteTheme}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
