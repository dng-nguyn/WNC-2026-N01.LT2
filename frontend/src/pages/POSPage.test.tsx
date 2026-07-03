import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import POSPage from './POSPage';
import type { MenuItem, Menu } from '../types';

const mockSetActiveCategory = vi.fn();
const mockAddToCart = vi.fn();
const mockUpdateQuantity = vi.fn();
const mockClearCart = vi.fn();
const mockClearMessages = vi.fn();

const mockUsePOSData = {
  menuItems: [] as MenuItem[],
  tables: [],
  categories: ['all'] as string[],
  activeCategory: 'all',
  setActiveCategory: mockSetActiveCategory,
  filteredItems: [] as MenuItem[],
  loading: false,
  error: '',
  refetch: vi.fn(),
};

const mockHandleCheckout = vi.fn().mockResolvedValue(undefined);

const mockUseCart = {
  cart: [] as { menuItem: MenuItem; quantity: number; note: string }[],
  selectedTableId: '',
  setSelectedTableId: vi.fn(),
  cartTotal: 0,
  cartItemCount: 0,
  submitting: false,
  error: '',
  success: '',
  addToCart: mockAddToCart,
  updateQuantity: mockUpdateQuantity,
  clearCart: mockClearCart,
  clearMessages: mockClearMessages,
  handleCheckout: mockHandleCheckout,
};

vi.mock('../hooks/usePOSData', () => ({ usePOSData: () => mockUsePOSData }));
vi.mock('../hooks/useCart', () => ({ useCart: () => mockUseCart }));

const mockMenu: Menu = { id: 'm1', name: 'Coffee', description: null, createdAt: '2025-01-01' };
const item1: MenuItem = { id: 'i1', name: 'Espresso', price: 45000, isAvailable: true, menu: mockMenu, createdAt: '2025-01-01' };

function resetMocks() {
  mockUsePOSData.menuItems = [];
  mockUsePOSData.filteredItems = [];
  mockUsePOSData.categories = ['all'];
  mockUsePOSData.activeCategory = 'all';
  mockUsePOSData.loading = false;
  mockUsePOSData.error = '';
  mockUseCart.cart = [];
  mockUseCart.cartTotal = 0;
  mockUseCart.cartItemCount = 0;
  mockUseCart.submitting = false;
  mockUseCart.error = '';
  mockUseCart.success = '';
}

describe('POSPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMocks();
  });

  it('shows loading state', () => {
    mockUsePOSData.loading = true;
    render(<MemoryRouter><POSPage /></MemoryRouter>);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders POS layout', () => {
    render(<MemoryRouter><POSPage /></MemoryRouter>);
    expect(document.querySelector('.pos-layout')).toBeInTheDocument();
  });

  it('renders product cards for items', () => {
    mockUsePOSData.menuItems = [item1];
    mockUsePOSData.filteredItems = [item1];
    render(<MemoryRouter><POSPage /></MemoryRouter>);
    expect(screen.getByText('Espresso')).toBeInTheDocument();
  });

  it('calls addToCart on product click', async () => {
    mockUsePOSData.menuItems = [item1];
    mockUsePOSData.filteredItems = [item1];
    const user = userEvent.setup();
    render(<MemoryRouter><POSPage /></MemoryRouter>);
    await user.click(screen.getByText('Espresso'));
    expect(mockAddToCart).toHaveBeenCalledWith(item1);
  });

  it('shows empty cart message', () => {
    render(<MemoryRouter><POSPage /></MemoryRouter>);
    expect(screen.getByText(/tap items to add them here/i)).toBeInTheDocument();
  });

  it('shows cart items when items in cart', () => {
    mockUseCart.cart = [{ menuItem: item1, quantity: 2, note: '' }];
    mockUseCart.cartItemCount = 2;
    mockUseCart.cartTotal = 90000;
    render(<MemoryRouter><POSPage /></MemoryRouter>);
    expect(screen.getByText('Espresso')).toBeInTheDocument();
  });

  it('shows error message', () => {
    mockUsePOSData.error = 'Failed to load';
    render(<MemoryRouter><POSPage /></MemoryRouter>);
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('shows success message', () => {
    mockUseCart.success = 'Order placed!';
    render(<MemoryRouter><POSPage /></MemoryRouter>);
    expect(screen.getByText('Order placed!')).toBeInTheDocument();
  });

  it('renders takeout checkbox', () => {
    render(<MemoryRouter><POSPage /></MemoryRouter>);
    expect(screen.getByLabelText(/takeout/i)).toBeInTheDocument();
  });

  it('shows Pay button when takeout is checked (default)', () => {
    mockUseCart.cart = [{ menuItem: item1, quantity: 1, note: '' }];
    mockUseCart.cartItemCount = 1;
    mockUseCart.cartTotal = 45000;
    render(<MemoryRouter><POSPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /pay/i })).toBeInTheDocument();
  });

  it('shows Order button when takeout is unchecked', async () => {
    mockUseCart.cart = [{ menuItem: item1, quantity: 1, note: '' }];
    mockUseCart.cartItemCount = 1;
    mockUseCart.cartTotal = 45000;
    const user = userEvent.setup();
    render(<MemoryRouter><POSPage /></MemoryRouter>);
    await user.click(screen.getByLabelText(/takeout/i));
    expect(screen.getByRole('button', { name: /order/i })).toBeInTheDocument();
  });

  it('disables Order button when no table selected and takeout unchecked', async () => {
    mockUseCart.cart = [{ menuItem: item1, quantity: 1, note: '' }];
    mockUseCart.cartItemCount = 1;
    mockUseCart.cartTotal = 45000;
    mockUseCart.selectedTableId = '';
    const user = userEvent.setup();
    render(<MemoryRouter><POSPage /></MemoryRouter>);
    await user.click(screen.getByLabelText(/takeout/i));
    expect(screen.getByRole('button', { name: /order/i })).toBeDisabled();
  });

  it('opens payment modal when Pay is clicked in takeout mode', async () => {
    mockUseCart.cart = [{ menuItem: item1, quantity: 1, note: '' }];
    mockUseCart.cartItemCount = 1;
    mockUseCart.cartTotal = 45000;
    const user = userEvent.setup();
    render(<MemoryRouter><POSPage /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: /pay/i }));
    expect(screen.getByText(/select payment method/i)).toBeInTheDocument();
  });
});
