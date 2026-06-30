import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import RegisterPage from './RegisterPage';

const mockRegister = vi.fn();
vi.mock('../services/auth.service', () => ({
  register: (...args: unknown[]) => mockRegister(...args),
}));

// Test wrapper that provides routing with a dashboard route for navigation testing
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={children} />
        <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RegisterPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRegister.mockResolvedValue(undefined);
  });

  it('renders register form with username, password, fullName, phone fields', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/username \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
  });

  it('shows Create Account button', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows link to login page', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });

  it('validates password minimum length (8 chars) - shows error', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/username \*/i), 'testuser');
    await user.type(screen.getByLabelText(/password \*/i), 'short');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('calls register() on form submit with correct values', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/username \*/i), 'newuser');
    await user.type(screen.getByLabelText(/password \*/i), 'password123');
    await user.type(screen.getByLabelText(/full name/i), 'New User');
    await user.type(screen.getByLabelText(/phone/i), '123-456-7890');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        username: 'newuser',
        password: 'password123',
        fullName: 'New User',
        phone: '123-456-7890',
      });
    });
  });

  it('navigates to /dashboard on successful registration', async () => {
    mockRegister.mockResolvedValueOnce(undefined);

    render(
      <TestWrapper>
        <RegisterPage />
      </TestWrapper>
    );

    await user.type(screen.getByLabelText(/username \*/i), 'newuser');
    await user.type(screen.getByLabelText(/password \*/i), 'password123');
    await user.type(screen.getByLabelText(/full name/i), 'New User');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });

  it('shows error message on registration failure', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Username already exists'));

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/username \*/i), 'existing');
    await user.type(screen.getByLabelText(/password \*/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Username already exists')).toBeInTheDocument();
    });
  });
});