import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import DashboardPage from './DashboardPage';

const mockUseDashboardStats = vi.fn();
const mockGetLoggedInUser = vi.fn();

vi.mock('../hooks/useDashboardStats', () => ({
  useDashboardStats: () => mockUseDashboardStats(),
}));

vi.mock('../services/auth.service', () => ({
  getLoggedInUser: () => mockGetLoggedInUser(),
}));

function renderDashboard(statsOverrides: Record<string, unknown> = {}) {
  const defaultStats = {
    totalRevenue: 150000,
    totalOrders: 3,
    completedOrders: 2,
    pendingOrders: 1,
    averageOrderValue: 50000,
    topItems: [{ name: 'Espresso', quantity: 5, revenue: 225000 }],
  };
  mockUseDashboardStats.mockReturnValue({
    stats: { ...defaultStats, ...statsOverrides },
    loading: false,
    error: '',
    refetch: vi.fn(),
  });
  mockGetLoggedInUser.mockReturnValue({ id: 'u1', username: 'barista' });

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <DashboardPage />
    </MemoryRouter>
  );
}

describe('DashboardPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows loading state', () => {
    mockUseDashboardStats.mockReturnValue({ stats: null, loading: true, error: '', refetch: vi.fn() });
    mockGetLoggedInUser.mockReturnValue({ id: 'u1', username: 'barista' });
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('displays Welcome with username', () => {
    renderDashboard();
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    expect(document.querySelector('.user-badge')?.textContent).toContain('barista');
  });

  it('displays Total Revenue stat card', () => {
    renderDashboard();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  it('displays Total Orders stat card', () => {
    renderDashboard();
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
  });

  it('displays Completed stat card', () => {
    renderDashboard();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('displays Pending stat card', () => {
    renderDashboard();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('displays Avg Order Value stat card', () => {
    renderDashboard();
    expect(screen.getByText('Avg Order Value')).toBeInTheDocument();
  });

  it('displays top selling items table', () => {
    renderDashboard();
    expect(screen.getByText('Top Selling Items')).toBeInTheDocument();
    expect(screen.getByText('Espresso')).toBeInTheDocument();
  });

  it('shows error on fetch failure', () => {
    mockUseDashboardStats.mockReturnValue({ stats: null, loading: false, error: 'DB error', refetch: vi.fn() });
    mockGetLoggedInUser.mockReturnValue({ id: 'u1', username: 'barista' });
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText('DB error')).toBeInTheDocument();
  });
});
