import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { ProtectedRoute, AdminRoute } from './ProtectedRoute';

function renderWithAuth(authValue, initialEntry = '/') {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<div data-testid="login">Login</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div data-testid="home">Home</div>} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<div data-testid="admin">Admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('ProtectedRoute', () => {
  it('redirects to /login when not authenticated', () => {
    renderWithAuth({ user: null, loading: false });
    expect(screen.getByTestId('login')).toBeInTheDocument();
  });

  it('renders content when authenticated', () => {
    renderWithAuth({ user: { id: '1' }, loading: false });
    expect(screen.getByTestId('home')).toBeInTheDocument();
  });

  it('renders nothing while loading', () => {
    const { container } = renderWithAuth({ user: null, loading: true });
    expect(container.innerHTML).toBe('');
  });
});

describe('AdminRoute', () => {
  it('redirects non-admin to home', () => {
    render(
      <AuthContext.Provider value={{ user: { id: '1' }, isAdmin: false, loading: false }}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/" element={<div data-testid="home">Home</div>} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<div data-testid="admin">Admin</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('home')).toBeInTheDocument();
  });

  it('renders admin content for admin users', () => {
    render(
      <AuthContext.Provider value={{ user: { id: '1' }, isAdmin: true, loading: false }}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<div data-testid="admin">Admin</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('admin')).toBeInTheDocument();
  });
});
