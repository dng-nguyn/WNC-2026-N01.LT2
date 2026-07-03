import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TablesPage from './TablesPage';
import type { Order } from '../types';

const mockFetchActiveOrders = vi.fn();
vi.mock('../services/order.service', () => ({
  fetchActiveOrders: (...args: unknown[]) => mockFetchActiveOrders(...args),
  updateOrder: vi.fn().mockResolvedValue({}),
}));
vi.mock('../services/payment.service', () => ({
  createPayment: vi.fn(),
  verifyPayment: vi.fn(),
}));
vi.mock('../services/auth.service', () => ({
  getLoggedInUser: () => ({ id: 'u1', username: 'barista' }),
}));

const mockOrder: Order = {
  id: 'order-1',
  table: { id: 't1', tableNumber: 'Table 1', status: 'OCCUPIED', createdAt: '2025-01-01' },
  user: { id: 'u1', username: 'barista', fullName: 'Barista', role: 'STAFF', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  status: 'PENDING' as any,
  totalAmount: 90000,
  items: [
    { id: 'oi1', menuItem: { id: 'i1', name: 'Espresso', price: 45000, isAvailable: true, menu: { id: 'm1', name: 'Coffee', description: null, createdAt: '2025-01-01' }, createdAt: '2025-01-01' }, quantity: 2, price: 45000, note: '' },
  ],
  createdAt: '2025-01-01T10:30:00.000Z',
  updatedAt: '2025-01-01T10:30:00.000Z',
};

const mockOrder2: Order = {
  ...mockOrder,
  id: 'order-2',
  totalAmount: 45000,
  items: [
    { id: 'oi2', menuItem: { id: 'i1', name: 'Espresso', price: 45000, isAvailable: true, menu: { id: 'm1', name: 'Coffee', description: null, createdAt: '2025-01-01' }, createdAt: '2025-01-01' }, quantity: 1, price: 45000, note: '' },
  ],
  createdAt: '2025-01-01T11:00:00.000Z',
};

describe('TablesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchActiveOrders.mockResolvedValue([mockOrder]);
  });

  it('shows loading state', () => {
    mockFetchActiveOrders.mockReturnValue(new Promise(() => {}));
    render(<MemoryRouter><TablesPage /></MemoryRouter>);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty state when no orders', async () => {
    mockFetchActiveOrders.mockResolvedValue([]);
    render(<MemoryRouter><TablesPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/no active orders/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /go to pos/i })).toBeInTheDocument();
  });

  it('renders table card with order', async () => {
    render(<MemoryRouter><TablesPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Table 1')).toBeInTheDocument();
    });
    expect(screen.getByText(/90[,.]000/)).toBeInTheDocument();
  });

  it('opens detail panel on table click', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><TablesPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Table 1')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Table 1'));
    expect(screen.getByText(/pay/i)).toBeInTheDocument();
  });

  it('shows consolidated items by default', async () => {
    mockFetchActiveOrders.mockResolvedValue([mockOrder, mockOrder2]);
    const user = userEvent.setup();
    render(<MemoryRouter><TablesPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Table 1')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Table 1'));
    // 2 orders consolidated: 2+1 = 3 items total
    expect(screen.getByText(/3× Espresso/)).toBeInTheDocument();
    expect(screen.getAllByText(/135[,.]000/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows split toggle in detail panel', async () => {
    mockFetchActiveOrders.mockResolvedValue([mockOrder, mockOrder2]);
    const user = userEvent.setup();
    render(<MemoryRouter><TablesPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Table 1')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Table 1'));
    expect(screen.getByLabelText(/split orders/i)).toBeInTheDocument();
  });

  it('splits into individual orders when toggle is on', async () => {
    mockFetchActiveOrders.mockResolvedValue([mockOrder, mockOrder2]);
    const user = userEvent.setup();
    render(<MemoryRouter><TablesPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Table 1')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Table 1'));
    await user.click(screen.getByLabelText(/split orders/i));
    // Should show individual order amounts
    expect(screen.getByText(/90[,.]000/)).toBeInTheDocument();
    expect(screen.getByText(/45[,.]000/)).toBeInTheDocument();
  });

  it('shows timestamps in split view', async () => {
    mockFetchActiveOrders.mockResolvedValue([mockOrder, mockOrder2]);
    const user = userEvent.setup();
    render(<MemoryRouter><TablesPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Table 1')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Table 1'));
    await user.click(screen.getByLabelText(/split orders/i));
    // Timestamps from createdAt (10:30 and 11:00 in vi-VN format)
    expect(screen.getByText(/10:30/)).toBeInTheDocument();
    expect(screen.getByText(/11:00/)).toBeInTheDocument();
  });

  it('shows error message', async () => {
    mockFetchActiveOrders.mockRejectedValue(new Error('Network error'));
    render(<MemoryRouter><TablesPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
