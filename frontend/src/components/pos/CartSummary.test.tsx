import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import CartSummary from './CartSummary';
import type { CartItem } from '../../hooks/useCart';
import type { MenuItem, Menu } from '../../types';

const mockMenu: Menu = {
  id: 'm1', name: 'Coffee', description: null, createdAt: '2025-01-01',
};

const mockMenuItem: MenuItem = {
  id: 'i1', name: 'Espresso', price: 45000, isAvailable: true,
  menu: mockMenu, createdAt: '2025-01-01',
};

const mockCart: CartItem[] = [
  { menuItem: mockMenuItem, quantity: 2, note: '' },
];

describe('CartSummary', () => {
  it('renders empty cart message', () => {
    render(
      <CartSummary cart={[]} cartTotal={0} cartItemCount={0}
        submitting={false} onUpdateQuantity={vi.fn()} onClear={vi.fn()} onCheckout={vi.fn()} />
    );
    expect(screen.getByText(/tap items to add them here/i)).toBeInTheDocument();
  });

  it('renders cart items with name and quantity', () => {
    render(
      <CartSummary cart={mockCart} cartTotal={90000} cartItemCount={2}
        submitting={false} onUpdateQuantity={vi.fn()} onClear={vi.fn()} onCheckout={vi.fn()} />
    );
    expect(screen.getByText('Espresso')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls onUpdateQuantity on + click', async () => {
    const onUpdateQuantity = vi.fn();
    const user = userEvent.setup();
    render(
      <CartSummary cart={mockCart} cartTotal={90000} cartItemCount={2}
        submitting={false} onUpdateQuantity={onUpdateQuantity} onClear={vi.fn()} onCheckout={vi.fn()} />
    );
    const plusButtons = screen.getAllByText('+');
    await user.click(plusButtons[0]);
    expect(onUpdateQuantity).toHaveBeenCalledWith('i1', 1);
  });

  it('calls onUpdateQuantity on - click', async () => {
    const onUpdateQuantity = vi.fn();
    const user = userEvent.setup();
    render(
      <CartSummary cart={mockCart} cartTotal={90000} cartItemCount={2}
        submitting={false} onUpdateQuantity={onUpdateQuantity} onClear={vi.fn()} onCheckout={vi.fn()} />
    );
    const decreaseBtn = screen.getByRole('button', { name: /decrease quantity/i });
    await user.click(decreaseBtn);
    expect(onUpdateQuantity).toHaveBeenCalledWith('i1', -1);
  });

  it('calls onCheckout on Pay click', async () => {
    const onCheckout = vi.fn();
    const user = userEvent.setup();
    render(
      <CartSummary cart={mockCart} cartTotal={90000} cartItemCount={2}
        submitting={false} onUpdateQuantity={vi.fn()} onClear={vi.fn()} onCheckout={onCheckout} />
    );
    await user.click(screen.getByRole('button', { name: /pay/i }));
    expect(onCheckout).toHaveBeenCalledOnce();
  });

  it('calls onClear on Clear click', async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();
    render(
      <CartSummary cart={mockCart} cartTotal={90000} cartItemCount={2}
        submitting={false} onUpdateQuantity={vi.fn()} onClear={onClear} onCheckout={vi.fn()} />
    );
    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('uses custom buttonLabel', () => {
    render(
      <CartSummary cart={mockCart} cartTotal={90000} cartItemCount={2}
        submitting={false} onUpdateQuantity={vi.fn()} onClear={vi.fn()} onCheckout={vi.fn()} buttonLabel="Order" />
    );
    expect(screen.getByRole('button', { name: /order/i })).toBeInTheDocument();
  });

  it('disables checkout button when checkoutDisabled is true', () => {
    render(
      <CartSummary cart={mockCart} cartTotal={90000} cartItemCount={2}
        submitting={false} onUpdateQuantity={vi.fn()} onClear={vi.fn()} onCheckout={vi.fn()} checkoutDisabled />
    );
    expect(screen.getByRole('button', { name: /pay/i })).toBeDisabled();
  });

  it('renders children between totals and button', () => {
    render(
      <CartSummary cart={mockCart} cartTotal={90000} cartItemCount={2}
        submitting={false} onUpdateQuantity={vi.fn()} onClear={vi.fn()} onCheckout={vi.fn()}>
        <div data-testid="child-content">Takeout</div>
      </CartSummary>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
});
