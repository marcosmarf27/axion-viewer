import { useState, useEffect } from 'react';
import axios from 'axios';

function ThemeSelector() {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      const response = await axios.get('/api/themes');
      if (response.data.success) {
        setThemes(response.data.themes);
      } else {
        setError('Erro ao carregar temas');
      }
    } catch (err) {
      setError('Erro ao conectar com a API: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const ColorSwatch = ({ label, color }) => (
    <div className="color-swatch">
      <div className="color-box" style={{ backgroundColor: color }} title={color} />
      <span className="color-label">{label}</span>
      <span className="color-value">{color}</span>
    </div>
  );

  if (loading) {
    return (
      <div className="theme-selector">
        <h2>Temas Disponíveis</h2>
        <p>Carregando temas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="theme-selector">
        <h2>Temas Disponíveis</h2>
        <div className="message error">{error}</div>
      </div>
    );
  }

  return (
    <div className="theme-selector">
      <h2>Temas Disponíveis</h2>
      <p className="subtitle">Visualize as cores e configurações de cada tema</p>

      <div className="themes-grid">
        {themes.map(theme => (
          <div key={theme.name} className="theme-card">
            <h3>{theme.name}</h3>
            <p className="theme-description">{theme.description}</p>

            {theme.colors && (
              <div className="colors-section">
                <h4>Cores do Tema</h4>
                <div className="colors-grid">
                  {Object.entries(theme.colors).map(([key, value]) => (
                    <ColorSwatch key={key} label={key.replace(/_/g, ' ')} color={value} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {themes.length === 0 && <p className="no-themes">Nenhum tema encontrado</p>}
    </div>
  );
}

export default ThemeSelector;
