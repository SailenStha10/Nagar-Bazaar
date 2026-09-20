import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/context/AuthContext';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';

jest.mock('@/utils/api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

function Harness() {
  const { user, loading, submitting, error, login, register, logout } = useAuth();

  return (
    <div>
      <p data-testid="loading">{String(loading)}</p>
      <p data-testid="submitting">{String(submitting)}</p>
      <p data-testid="user">{user ? user.name : 'none'}</p>
      <p data-testid="error">{error || 'none'}</p>
      <button onClick={() => login('sita@example.com', 'password123').catch(() => {})}>Login</button>
      <button onClick={() => register({ name: 'Sita', email: 'sita@example.com', password: 'password123' }).catch(() => {})}>
        Register
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

const renderHarness = () =>
  render(
    <AuthProvider>
      <Harness />
    </AuthProvider>
  );

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('throws when used outside an AuthProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Harness />)).toThrow(/must be used within an AuthProvider/);
    consoleError.mockRestore();
  });

  it('starts with no user and finishes loading when localStorage is empty', async () => {
    renderHarness();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('restores the user from localStorage on mount', async () => {
    localStorage.setItem('token', 'stored-token');
    localStorage.setItem('user', JSON.stringify({ userId: '1', name: 'Stored User', role: 'customer' }));

    renderHarness();

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Stored User'));
  });

  it('logs in successfully and persists the session', async () => {
    api.post.mockResolvedValueOnce({
      data: { token: 'new-token', user: { userId: '1', name: 'Sita', role: 'customer' } },
    });

    const user = userEvent.setup();
    renderHarness();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await user.click(screen.getByText('Login'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Sita'));
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'sita@example.com', password: 'password123' });
    expect(localStorage.getItem('token')).toBe('new-token');
  });

  it('surfaces a login error and does not set a user', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { message: 'Invalid password' } } });

    const user = userEvent.setup();
    renderHarness();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await user.click(screen.getByText('Login'));

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Invalid password'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('registers successfully', async () => {
    api.post.mockResolvedValueOnce({
      data: { token: 'reg-token', user: { userId: '2', name: 'Sita', role: 'customer' } },
    });

    const user = userEvent.setup();
    renderHarness();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await user.click(screen.getByText('Register'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Sita'));
    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Sita',
      email: 'sita@example.com',
      password: 'password123',
    });
  });

  it('logs out and clears the stored session', async () => {
    localStorage.setItem('token', 'stored-token');
    localStorage.setItem('user', JSON.stringify({ userId: '1', name: 'Stored User', role: 'customer' }));

    const user = userEvent.setup();
    renderHarness();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Stored User'));

    await user.click(screen.getByText('Logout'));

    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
