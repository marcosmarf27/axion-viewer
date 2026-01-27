import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, AuthContext } from './AuthContext';
import { useContext } from 'react';

// Mock supabase
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args) => mockGetSession(...args),
      onAuthStateChange: (...args) => mockOnAuthStateChange(...args),
      signInWithPassword: (...args) => mockSignInWithPassword(...args),
      signOut: (...args) => mockSignOut(...args),
    },
    from: (...args) => mockFrom(...args),
  },
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

function TestConsumer() {
  const auth = useContext(AuthContext);
  return (
    <div>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="user">{auth.user ? auth.user.id : 'null'}</span>
      <span data-testid="isAdmin">{String(auth.isAdmin)}</span>
      <span data-testid="isClient">{String(auth.isClient)}</span>
      <button data-testid="signOut" onClick={auth.signOut}>
        Logout
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it('starts in loading state and resolves with no user', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });

  it('loads user and profile from session', async () => {
    const mockUser = { id: 'user-123' };
    mockGetSession.mockResolvedValue({
      data: { session: { user: mockUser } },
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'user-123', role: 'admin', email: 'admin@test.com' },
            error: null,
          }),
        }),
      }),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user-123');
    });
    await waitFor(() => {
      expect(screen.getByTestId('isAdmin')).toHaveTextContent('true');
    });
  });

  it('signOut clears user and profile', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignOut.mockResolvedValue({});

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await act(async () => {
      await userEvent.click(screen.getByTestId('signOut'));
    });

    expect(mockSignOut).toHaveBeenCalled();
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });
});
