import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import ThemeSelector from './ThemeSelector';

vi.mock('axios');

describe('ThemeSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra estado de carregamento inicialmente', () => {
    axios.get.mockImplementation(() => new Promise(() => {}));
    render(<ThemeSelector />);

    expect(screen.getByText('Carregando temas...')).toBeInTheDocument();
  });

  it('renderiza lista de temas após carregamento', async () => {
    const mockThemes = [
      {
        name: 'juridico',
        description: 'Tema para documentos jurídicos',
        colors: {
          primary: '#BE3000',
          secondary: '#3A1101',
        },
      },
    ];

    axios.get.mockResolvedValue({
      data: { success: true, themes: mockThemes },
    });

    render(<ThemeSelector />);

    await waitFor(() => {
      expect(screen.getByText('juridico')).toBeInTheDocument();
    });

    expect(screen.getByText('Tema para documentos jurídicos')).toBeInTheDocument();
  });

  it('exibe mensagem de erro quando API falha', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));

    render(<ThemeSelector />);

    await waitFor(() => {
      expect(screen.getByText(/Erro ao conectar com a API/)).toBeInTheDocument();
    });
  });

  it('exibe mensagem quando não há temas', async () => {
    axios.get.mockResolvedValue({
      data: { success: true, themes: [] },
    });

    render(<ThemeSelector />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum tema encontrado')).toBeInTheDocument();
    });
  });

  it('renderiza cores do tema corretamente', async () => {
    const mockThemes = [
      {
        name: 'teste',
        description: 'Tema de teste',
        colors: {
          primary_color: '#FF0000',
        },
      },
    ];

    axios.get.mockResolvedValue({
      data: { success: true, themes: mockThemes },
    });

    render(<ThemeSelector />);

    await waitFor(() => {
      expect(screen.getByText('primary color')).toBeInTheDocument();
    });
  });
});
