import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import ProductCard from './ProductCard';
import type { MenuItem } from '../../types';
import type { Menu } from '../../types';

const mockMenu: Menu = {
  id: 'm1', name: 'Coffee', description: null, createdAt: '2025-01-01',
};

const mockItem: MenuItem = {
  id: 'i1', name: 'Espresso', price: 45000, isAvailable: true,
  menu: mockMenu, createdAt: '2025-01-01',
};

describe('ProductCard', () => {
  it('renders item name, category, and price', () => {
    render(<ProductCard item={mockItem} onAdd={vi.fn()} />);
    expect(screen.getByText('Espresso')).toBeInTheDocument();
    expect(screen.getByText('Coffee')).toBeInTheDocument();
  });

  it('calls onAdd on click', async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<ProductCard item={mockItem} onAdd={onAdd} />);
    await user.click(screen.getByRole('button'));
    expect(onAdd).toHaveBeenCalledWith(mockItem);
  });

  it('shows unavailable text when not available', () => {
    const unavailable = { ...mockItem, isAvailable: false };
    render(<ProductCard item={unavailable} onAdd={vi.fn()} />);
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  it('disables button when not available', () => {
    const unavailable = { ...mockItem, isAvailable: false };
    render(<ProductCard item={unavailable} onAdd={vi.fn()} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
