import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PaymentModal from './PaymentModal';
import type { CartItem } from '../../hooks/useCart';
import type { MenuItem, Menu } from '../../types';

const mockMenu: Menu = { id: 'm1', name: 'Coffee', description: null, createdAt: '2025-01-01' };
const mockItem: MenuItem = { id: 'i1', name: 'Espresso', price: 45000, isAvailable: true, menu: mockMenu, createdAt: '2025-01-01' };
const cart: CartItem[] = [{ menuItem: mockItem, quantity: 2, note: '' }];

vi.mock('../../services/order.service', () => ({ createOrder: vi.fn() }));
vi.mock('../../services/payment.service', () => ({ createPayment: vi.fn(), verifyPayment: vi.fn() }));
vi.mock('../../services/auth.service', () => ({ getLoggedInUser: () => ({ id: 'u1', username: 'barista' }) }));

describe('PaymentModal', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders nothing when closed', () => {
    render(<PaymentModal open={false} cart={cart} cartTotal={90000} selectedTableId="" onClose={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.queryByText(/payment method/i)).not.toBeInTheDocument();
  });

  it('shows payment method selection when open', () => {
    render(<PaymentModal open={true} cart={cart} cartTotal={90000} selectedTableId="" onClose={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByText(/select payment method/i)).toBeInTheDocument();
  });

  it('shows cash payment option', () => {
    render(<PaymentModal open={true} cart={cart} cartTotal={90000} selectedTableId="" onClose={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByRole('button', { name: /cash/i })).toBeInTheDocument();
  });

  it('shows QR payment option', () => {
    render(<PaymentModal open={true} cart={cart} cartTotal={90000} selectedTableId="" onClose={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByRole('button', { name: /bank transfer/i })).toBeInTheDocument();
  });

  it('shows cart total', () => {
    render(<PaymentModal open={true} cart={cart} cartTotal={90000} selectedTableId="" onClose={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByText(/90[,.]000/)).toBeInTheDocument();
  });

  it('calls onClose on close button', () => {
    const onClose = vi.fn();
    render(<PaymentModal open={true} cart={cart} cartTotal={90000} selectedTableId="" onClose={onClose} onSuccess={vi.fn()} />);
    const closeBtn = screen.getByRole('button', { name: /close/i });
    closeBtn.click();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
