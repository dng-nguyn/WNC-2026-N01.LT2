import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AppLayout from './AppLayout';
import { I18nProvider } from '../i18n';

const mockLogout = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../services/auth.service', () => ({
  logout: () => mockLogout(),
  getLoggedInUser: () => ({ id: 'u1', username: 'barista' }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sidebar with navigation links', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
        <AppLayout><div>Content</div></AppLayout>
        </I18nProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('POS Terminal')).toBeInTheDocument();
    expect(screen.getByText('Menu Categories')).toBeInTheDocument();
    expect(screen.getByText('Menu Items')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
        <AppLayout><div>Page Content</div></AppLayout>
        </I18nProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('renders user avatar with first letter', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
        <AppLayout><div /></AppLayout>
        </I18nProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('barista')).toBeInTheDocument();
  });

  it('calls logout and navigates on logout click', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <I18nProvider>
        <AppLayout><div /></AppLayout>
        </I18nProvider>
      </MemoryRouter>
    );
    await user.click(screen.getByText('Logout'));
    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
