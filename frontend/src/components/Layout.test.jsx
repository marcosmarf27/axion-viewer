import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import Layout from './Layout';

function renderLayout(profile) {
  return render(
    <AuthContext.Provider
      value={{
        user: { id: '1' },
        profile,
        loading: false,
        signOut: vi.fn(),
        isAdmin: profile.role === 'admin',
        isClient: profile.role === 'client',
      }}
    >
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('Layout', () => {
  it('renders admin sidebar with all admin nav items', () => {
    renderLayout({ role: 'admin', email: 'admin@test.com', full_name: 'Admin' });

    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Carteiras')).toBeInTheDocument();
    expect(screen.getByText('Casos')).toBeInTheDocument();
    expect(screen.getByText('Processos')).toBeInTheDocument();
    expect(screen.getByText('Documentos')).toBeInTheDocument();
    expect(screen.getByText('Converter')).toBeInTheDocument();
    expect(screen.getByText('Temas')).toBeInTheDocument();
    expect(screen.getByText('Contas')).toBeInTheDocument();
    expect(screen.getByText('Compartilhamento')).toBeInTheDocument();
  });

  it('renders client sidebar with limited nav items', () => {
    renderLayout({ role: 'client', email: 'client@test.com', full_name: 'Cliente' });

    expect(screen.getByText('Minhas Carteiras')).toBeInTheDocument();
    expect(screen.queryByText('Clientes')).not.toBeInTheDocument();
    expect(screen.queryByText('Converter')).not.toBeInTheDocument();
  });

  it('shows admin role label for admin users', () => {
    renderLayout({ role: 'admin', email: 'admin@test.com', full_name: 'Admin User' });
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  it('shows client role label for client users', () => {
    renderLayout({ role: 'client', email: 'client@test.com', full_name: 'Client User' });
    expect(screen.getByText('Cliente')).toBeInTheDocument();
  });

  it('displays user name in header', () => {
    renderLayout({ role: 'admin', email: 'admin@test.com', full_name: 'Marcos' });
    expect(screen.getByText('Marcos')).toBeInTheDocument();
  });
});
