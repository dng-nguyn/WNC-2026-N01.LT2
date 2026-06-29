import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import DashboardPage from './DashboardPage';
import type { Order } from '../types';

const mockFetchOrders = vi.fn();
const mockGetLoggedInUser = vi.fn();

vi.mock('../services/order.service', () => ({
  fetchOrders: () => mockFetchOrders(),
}));

vi.mock('../services/auth.service', () => ({
  logout: vi.fn(),
  getLoggedInUser: () => mockGetLoggedInUser(),
}));

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n).replace(/\u00a0/g, ' ');

async function renderDashboard(
  options: {
    initialOrders?: Order[];
    initialUser?: { id: string; username: string } | null;
    waitLoading?: boolean;
  } = {}
) {
  const { initialOrders = [], initialUser = { id: 'u1', username: 'barista' }, waitLoading = true } = options;
  mockFetchOrders.mockResolvedValue(initialOrders);
  mockGetLoggedInUser.mockReturnValue(initialUser);

  const result = render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <DashboardPage />
    </MemoryRouter>
  );

  if (waitLoading) {
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard…')).not.toBeInTheDocument();
    });
  }

  return result;
}

function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    table: null,
    user: { id: 'u1', username: 'barista', createdAt: new Date().toISOString() },
    status: 'COMPLETED' as const,
    totalAmount: 100000,
    items: [
      {
        id: 'item-1',
        menuItem: {
          id: 'mi-1',
          menu: { id: 'm1', name: 'Coffee', description: '', createdAt: new Date().toISOString() },
          name: 'Coffee',
          price: 50000,
          isAvailable: true,
          createdAt: new Date().toISOString(),
        },
        quantity: 2,
        price: 50000,
        note: null,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLoggedInUser.mockReturnValue({ id: 'u1', username: 'barista' });
    mockFetchOrders.mockResolvedValue([]);
  });

  it('shows loading state initially', async () => {
    const { promise, resolve } = Promise.withResolvers<Order[]>();
    mockFetchOrders.mockReturnValue(promise);
    mockGetLoggedInUser.mockReturnValue({ id: 'u1', username: 'barista' });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading dashboard…')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();

    resolve([]);
    await waitFor(() => expect(screen.queryByText('Loading dashboard…')).not.toBeInTheDocument());
  });

  it('displays Welcome, {username} for logged-in user', async () => {
    await renderDashboard({ initialUser: { id: 'u1', username: 'barista' } });

    expect(screen.getByText('Welcome, barista')).toBeInTheDocument();
  });

  it('displays stats cards (Total Revenue, Total Orders, Completed, Pending, Avg Order Value)', async () => {
    const orders = [
      createMockOrder({ totalAmount: 100000, status: 'COMPLETED' }),
      createMockOrder({ totalAmount: 50000, status: 'PENDING' }),
      createMockOrder({ totalAmount: 75000, status: 'COMPLETED' }),
    ];
    await renderDashboard({ initialOrders: orders });

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Avg Order Value')).toBeInTheDocument();

    expect(screen.getByText(formatCurrency(225000))).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(75000))).toBeInTheDocument();

    const pendingCard = screen.getByText('Pending').closest('.stat-card');
    expect(pendingCard).toHaveTextContent('1');

    const completedCard = screen.getByText('Completed').closest('.stat-card');
    expect(completedCard).toHaveTextContent('2');

    const totalOrdersCard = screen.getByText('Total Orders').closest('.stat-card');
    expect(totalOrdersCard).toHaveTextContent('3');
  });

  it('displays top selling items table', async () => {
    const orders = [
      createMockOrder({
        items: [
          {
            id: 'item-1',
            menuItem: {
              id: 'mi-1',
              menu: { id: 'm1', name: 'Coffee', description: '', createdAt: new Date().toISOString() },
              name: 'Coffee',
              price: 50000,
              isAvailable: true,
              createdAt: new Date().toISOString(),
            },
            quantity: 2,
            price: 50000,
            note: null,
          },
        ],
      }),
      createMockOrder({
        items: [
          {
            id: 'item-2',
            menuItem: {
              id: 'mi-2',
              menu: { id: 'm1', name: 'Tea', description: '', createdAt: new Date().toISOString() },
              name: 'Tea',
              price: 30000,
              isAvailable: true,
              createdAt: new Date().toISOString(),
            },
            quantity: 3,
            price: 30000,
            note: null,
          },
        ],
      }),
    ];
    await renderDashboard({ initialOrders: orders });

    expect(screen.getByText('Top Selling Items')).toBeInTheDocument();
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Tea')).toBeInTheDocument();

    const coffeeRow = screen.getByText('Coffee').closest('tr');
    expect(coffeeRow).toHaveTextContent('2');

    const teaRow = screen.getByText('Tea').closest('tr');
    expect(teaRow).toHaveTextContent('3');
  });

  it('shows "No orders yet" when no orders', async () => {
    await renderDashboard({ initialOrders: [] });

    expect(screen.getByText('No orders yet')).toBeInTheDocument();
  });

  it('handles fetchOrders failure gracefully (shows error)', async () => {
    mockFetchOrders.mockRejectedValue(new Error('Network error'));
    mockGetLoggedInUser.mockReturnValue({ id: 'u1', username: 'barista' });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    expect(screen.queryByText('Total Revenue')).not.toBeInTheDocument();
  });

});