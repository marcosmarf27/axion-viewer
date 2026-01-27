import { useState, useEffect } from 'react';
import axios from 'axios';
import './ThemeManager.css';

function ThemeManager() {
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
  const [deleting, setDeleting] = useState(false);
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

  const loadThemes = async (preserveThemeName = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/themes');
      if (response.data.success) {
        setThemes(response.data.themes);
        if (response.data.themes.length > 0) {
          // Se houver um tema para preservar, encontra-o na nova lista
          if (preserveThemeName) {
            const preservedTheme = response.data.themes.find(t => t.name === preserveThemeName);
            if (preservedTheme) {
              setSelectedTheme(preservedTheme);
              return;
            }
          }
          // Se não houver tema para preservar, usa o tema padrão
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
      const response = await axios.put(`/api/themes/${editedTheme.name}`, {
        colors: editedTheme.colors,
        styling: editedTheme.styling,
        fonts: editedTheme.fonts,
      });

      if (response.data.success) {
        setSaveMessage({ type: 'success', text: 'Tema salvo com sucesso!' });
        // Preserva o tema atual selecionado após recarregar a lista
        await loadThemes(currentThemeName);
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Erro ao salvar: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEditedTheme(JSON.parse(JSON.stringify(selectedTheme)));
    setSaveMessage({ type: 'info', text: 'Alterações revertidas' });
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const hasChanges = () => {
    return JSON.stringify(editedTheme) !== JSON.stringify(selectedTheme);
  };

  // Função para criar novo tema
  const handleCreateTheme = async () => {
    if (!newTheme.name.trim()) {
      setSaveMessage({ type: 'error', text: 'Nome do tema é obrigatório' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setCreating(true);
    setSaveMessage(null);
    try {
      const themeName = newTheme.name.trim().toLowerCase().replace(/\s+/g, '-');
      const response = await axios.post('/api/themes', {
        name: themeName,
        description: newTheme.description || `Tema ${newTheme.name}`,
        primary_color: newTheme.primary_color,
        logo: newTheme.logo,
      });

      if (response.data.success) {
        setSaveMessage({ type: 'success', text: `Tema "${newTheme.name}" criado com sucesso!` });
        setShowCreateModal(false);
        setNewTheme({ name: '', description: '', primary_color: '#0066CC', logo: '' });
        // Carrega temas e seleciona o novo tema criado
        await loadThemes(themeName);
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setSaveMessage({ type: 'error', text: `Erro ao criar tema: ${errorMsg}` });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setCreating(false);
    }
  };

  // Função para excluir tema
  const handleDeleteTheme = async () => {
    if (!selectedTheme || selectedTheme.name === 'juridico') return;

    setDeleting(true);
    try {
      const deletedThemeName = selectedTheme.name;
      const response = await axios.delete(`/api/themes/${selectedTheme.name}`);

      if (response.data.success) {
        setSaveMessage({ type: 'success', text: `Tema "${deletedThemeName}" excluído!` });
        setShowDeleteConfirm(false);

        // Se o tema excluído era o padrão, reseta para juridico
        if (deletedThemeName === defaultTheme) {
          localStorage.setItem('defaultTheme', 'juridico');
          setDefaultTheme('juridico');
        }

        // Após excluir, carrega temas sem preservar (seleciona o primeiro disponível)
        await loadThemes();
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setSaveMessage({ type: 'error', text: `Erro ao excluir: ${errorMsg}` });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setDeleting(false);
    }
  };

  // Função para gerar preview das cores derivadas
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

  // Função para definir tema como padrão
  const handleSetDefaultTheme = () => {
    if (selectedTheme) {
      localStorage.setItem('defaultTheme', selectedTheme.name);
      setDefaultTheme(selectedTheme.name);
      setSaveMessage({
        type: 'success',
        text: `"${selectedTheme.name}" definido como tema padrão!`,
      });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  // Função para iniciar edição do nome
  const startEditingName = () => {
    setNewThemeName(selectedTheme?.name || '');
    setEditingName(true);
  };

  // Função para cancelar edição do nome
  const cancelEditingName = () => {
    setEditingName(false);
    setNewThemeName('');
  };

  // Função para renomear o tema
  const handleRenameTheme = async () => {
    if (!selectedTheme || !newThemeName.trim()) return;

    const cleanName = newThemeName.trim().toLowerCase().replace(/\s+/g, '-');

    if (cleanName === selectedTheme.name) {
      setEditingName(false);
      return;
    }

    setRenaming(true);
    try {
      const response = await axios.patch(`/api/themes/${selectedTheme.name}/rename`, {
        new_name: cleanName,
      });

      if (response.data.success) {
        setSaveMessage({ type: 'success', text: `Tema renomeado para "${cleanName}"!` });
        setEditingName(false);
        setNewThemeName('');

        // Atualiza o tema padrão se necessário
        if (selectedTheme.name === defaultTheme) {
          localStorage.setItem('defaultTheme', cleanName);
          setDefaultTheme(cleanName);
        }

        // Recarrega os temas e seleciona o tema renomeado
        await loadThemes(cleanName);
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setSaveMessage({ type: 'error', text: `Erro ao renomear: ${errorMsg}` });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setRenaming(false);
    }
  };

  if (loading) {
    return (
      <div className="theme-manager">
        <div className="loading">Carregando temas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="theme-manager">
        <div className="error">
          <p>{error}</p>
          <button onClick={loadThemes}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  const derivedColors = getDerivedColors(newTheme.primary_color);

  return (
    <div className="theme-manager">
      <div className="manager-header">
        <h2>Editor de Temas</h2>
        <p>Personalize cores, gradientes e bordas do seu tema</p>
      </div>

      {/* Mensagem de feedback global */}
      {saveMessage && (
        <div className={`global-message ${saveMessage.type}`}>{saveMessage.text}</div>
      )}

      <div className="theme-content">
        <div className="theme-sidebar">
          <div className="sidebar-header">
            <h3>Temas Disponíveis</h3>
            <button
              className="btn-create-theme"
              onClick={() => setShowCreateModal(true)}
              title="Criar novo tema"
            >
              + Novo Tema
            </button>
          </div>
          <div className="theme-list">
            {themes.map((theme, index) => (
              <div
                key={index}
                className={`theme-item ${selectedTheme?.name === theme.name ? 'active' : ''}`}
                onClick={() => setSelectedTheme(theme)}
              >
                <div className="theme-preview-colors">
                  {theme.colors?.primary && (
                    <div className="color-dot" style={{ background: theme.colors.primary }} />
                  )}
                  {theme.colors?.dark && (
                    <div className="color-dot" style={{ background: theme.colors.dark }} />
                  )}
                </div>
                <div className="theme-info">
                  <div className="theme-name">
                    {theme.name}
                    {theme.name === defaultTheme && (
                      <span className="default-badge" title="Tema padrão">
                        Padrão
                      </span>
                    )}
                  </div>
                  <div className="theme-desc">{theme.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {editedTheme && (
          <div className="theme-editor">
            <div className="editor-header">
              <div className="editor-title">
                {editingName ? (
                  <div className="name-edit-group">
                    <input
                      type="text"
                      value={newThemeName}
                      onChange={e => setNewThemeName(e.target.value)}
                      className="name-edit-input"
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
                      className="btn-name-save"
                      title="Salvar nome"
                    >
                      {renaming ? '...' : '✓'}
                    </button>
                    <button
                      onClick={cancelEditingName}
                      disabled={renaming}
                      className="btn-name-cancel"
                      title="Cancelar"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <h3>
                    Editando: {editedTheme.name}
                    {selectedTheme?.name !== 'juridico' && (
                      <button
                        onClick={startEditingName}
                        className="btn-edit-name"
                        title="Editar nome do tema"
                      >
                        ✎
                      </button>
                    )}
                  </h3>
                )}
              </div>
              <div className="editor-actions">
                {selectedTheme?.name !== 'juridico' && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="btn-delete"
                    title="Excluir tema"
                  >
                    Excluir
                  </button>
                )}
                <button
                  onClick={handleSetDefaultTheme}
                  disabled={selectedTheme?.name === defaultTheme}
                  className="btn-default"
                  title="Definir este tema como padrão"
                >
                  {selectedTheme?.name === defaultTheme ? 'Tema Padrão' : 'Definir como Padrão'}
                </button>
                <button
                  onClick={handleReset}
                  disabled={!hasChanges() || saving}
                  className="btn-reset"
                >
                  Reverter
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges() || saving}
                  className="btn-save"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>

            <div className="editor-sections">
              {/* Cores */}
              <div className="editor-section">
                <h4>Cores</h4>
                <div className="color-editors">
                  {Object.entries(editedTheme.colors || {}).map(([key, value]) => (
                    <div key={key} className="color-editor">
                      <label>
                        <span className="color-label">{key}</span>
                        <div className="color-input-group">
                          <input
                            type="color"
                            value={value.startsWith('rgba') ? '#000000' : value}
                            onChange={e => handleColorChange(key, e.target.value)}
                            disabled={value.startsWith('rgba')}
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={e => handleColorChange(key, e.target.value)}
                            className="color-text-input"
                          />
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gradientes */}
              <div className="editor-section">
                <h4>Gradientes</h4>
                <div className="gradient-editors">
                  {Object.entries(editedTheme.styling?.gradients || {}).map(([key, value]) => {
                    const numValue = parseInt(value) || 135;
                    return (
                      <div key={key} className="gradient-editor">
                        <label>
                          <span className="gradient-label">{key}</span>
                          <div
                            className="gradient-preview"
                            style={{
                              background: `linear-gradient(${value}, ${editedTheme.colors.primary} 0%, ${editedTheme.colors.dark} 50%, ${editedTheme.colors.black_tone} 100%)`,
                            }}
                          ></div>
                          <div className="slider-group">
                            <input
                              type="range"
                              min="0"
                              max="360"
                              value={numValue}
                              onChange={e => handleGradientChange(key, e.target.value)}
                              className="gradient-slider"
                            />
                            <span className="slider-value">{value}</span>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bordas */}
              <div className="editor-section">
                <h4>Espessuras de Bordas</h4>
                <div className="border-editors">
                  {Object.entries(editedTheme.styling?.borders || {}).map(([key, value]) => {
                    const numValue = parseInt(value) || 2;
                    return (
                      <div key={key} className="border-editor">
                        <label>
                          <span className="border-label">{key}</span>
                          <div
                            className="border-preview"
                            style={{
                              borderBottom: `${value} solid ${editedTheme.colors.primary}`,
                            }}
                          ></div>
                          <div className="slider-group">
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={numValue}
                              onChange={e => handleBorderChange(key, e.target.value)}
                              className="border-slider"
                            />
                            <span className="slider-value">{value}</span>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="editor-section">
                <h4>Preview do Tema</h4>
                <div className="theme-preview">
                  <div
                    className="preview-header"
                    style={{
                      background: `linear-gradient(${editedTheme.styling?.gradients?.header_angle || '135deg'}, ${editedTheme.colors.primary} 0%, ${editedTheme.colors.dark} 50%, ${editedTheme.colors.black_tone} 100%)`,
                    }}
                  >
                    <h1>Título do Documento</h1>
                    <p>Subtítulo exemplo</p>
                  </div>

                  <div className="preview-content">
                    <h2
                      style={{
                        borderBottom: `${editedTheme.styling?.borders?.h1 || '3px'} solid ${editedTheme.colors.primary}`,
                        color: editedTheme.colors.dark,
                      }}
                    >
                      Título H1
                    </h2>

                    <h3
                      style={{
                        borderBottom: `${editedTheme.styling?.borders?.h2 || '2px'} solid ${editedTheme.colors.primary}`,
                        color: editedTheme.colors.dark,
                      }}
                    >
                      Título H2
                    </h3>

                    <div
                      className="preview-alert critical"
                      style={{
                        background: editedTheme.colors.light_danger_bg,
                        borderLeft: `${editedTheme.styling?.borders?.alert_boxes || '4px'} solid ${editedTheme.colors.danger}`,
                      }}
                    >
                      <strong style={{ color: editedTheme.colors.danger }}>Alerta Crítico</strong>
                    </div>

                    <div
                      className="preview-alert warning"
                      style={{
                        background: editedTheme.colors.light_warning_bg,
                        borderLeft: `${editedTheme.styling?.borders?.alert_boxes || '4px'} solid ${editedTheme.colors.warning}`,
                      }}
                    >
                      <strong style={{ color: editedTheme.colors.warning }}>Alerta Médio</strong>
                    </div>

                    <div
                      className="preview-alert success"
                      style={{
                        background: editedTheme.colors.light_success_bg,
                        borderLeft: `${editedTheme.styling?.borders?.alert_boxes || '4px'} solid ${editedTheme.colors.success}`,
                      }}
                    >
                      <strong style={{ color: editedTheme.colors.success }}>Alerta Baixo</strong>
                    </div>
                  </div>

                  <div
                    className="preview-footer"
                    style={{
                      background: `linear-gradient(${editedTheme.styling?.gradients?.footer_angle || '135deg'}, ${editedTheme.colors.primary} 0%, ${editedTheme.colors.dark} 50%, ${editedTheme.colors.black_tone} 100%)`,
                    }}
                  >
                    <p>Rodapé do Documento</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Criar Novo Tema */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Criar Novo Tema</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Nome do Tema *</label>
                <input
                  type="text"
                  value={newTheme.name}
                  onChange={e => setNewTheme(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ex: financeiro, medico, imobiliario"
                  className="form-input"
                />
                <small>Apenas letras, números e hífens. Será convertido para minúsculas.</small>
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <input
                  type="text"
                  value={newTheme.description}
                  onChange={e => setNewTheme(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="ex: Tema para relatórios financeiros"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Cor Principal</label>
                <div className="color-picker-group">
                  <input
                    type="color"
                    value={newTheme.primary_color}
                    onChange={e =>
                      setNewTheme(prev => ({ ...prev, primary_color: e.target.value }))
                    }
                    className="color-picker-large"
                  />
                  <input
                    type="text"
                    value={newTheme.primary_color}
                    onChange={e =>
                      setNewTheme(prev => ({ ...prev, primary_color: e.target.value }))
                    }
                    className="form-input color-hex-input"
                  />
                </div>
              </div>

              {/* Preview das cores derivadas */}
              <div className="form-group">
                <label>Preview das Cores (geradas automaticamente)</label>
                <div className="derived-colors-preview">
                  <div className="derived-color">
                    <div
                      className="color-swatch"
                      style={{ background: derivedColors.primary }}
                    ></div>
                    <span>Primary</span>
                  </div>
                  <div className="derived-color">
                    <div className="color-swatch" style={{ background: derivedColors.dark }}></div>
                    <span>Dark</span>
                  </div>
                  <div className="derived-color">
                    <div
                      className="color-swatch"
                      style={{ background: derivedColors.black_tone }}
                    ></div>
                    <span>Black Tone</span>
                  </div>
                </div>
                <div
                  className="gradient-preview-modal"
                  style={{
                    background: `linear-gradient(135deg, ${derivedColors.primary} 0%, ${derivedColors.dark} 50%, ${derivedColors.black_tone} 100%)`,
                  }}
                >
                  <span>Preview do Gradiente</span>
                </div>
              </div>

              <div className="form-group">
                <label>URL do Logo (opcional)</label>
                <input
                  type="text"
                  value={newTheme.logo}
                  onChange={e => setNewTheme(prev => ({ ...prev, logo: e.target.value }))}
                  placeholder="https://exemplo.com/logo.png"
                  className="form-input"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Cancelar
              </button>
              <button
                className="btn-create"
                onClick={handleCreateTheme}
                disabled={creating || !newTheme.name.trim()}
              >
                {creating ? 'Criando...' : 'Criar Tema'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content modal-small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmar Exclusão</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <p>
                Tem certeza que deseja excluir o tema <strong>"{selectedTheme?.name}"</strong>?
              </p>
              <p className="warning-text">Esta ação não pode ser desfeita.</p>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="btn-delete-confirm"
                onClick={handleDeleteTheme}
                disabled={deleting}
              >
                {deleting ? 'Excluindo...' : 'Excluir Tema'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeManager;
