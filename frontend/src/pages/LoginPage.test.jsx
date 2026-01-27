import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import LoginPage from './LoginPage';

function renderLoginPage(authOverrides = {}) {
  const defaultAuth = {
    user: null,
    loading: false,
    signIn: vi.fn(),
    ...authOverrides,
  };
  return {
    ...render(
      <AuthContext.Provider value={defaultAuth}>
        <MemoryRouter initialEntries={['/login']}>
          <LoginPage />
        </MemoryRouter>
      </AuthContext.Provider>
    ),
    auth: defaultAuth,
  };
}

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('calls signIn on form submit', async () => {
    const { auth } = renderLoginPage();
    auth.signIn.mockResolvedValue({});

    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(auth.signIn).toHaveBeenCalledWith('test@test.com', 'password123');
  });

  it('shows error on failed login', async () => {
    const { auth } = renderLoginPage();
    auth.signIn.mockRejectedValue(new Error('Invalid login credentials'));

    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/invalid login credentials/i)).toBeInTheDocument();
  });
});
