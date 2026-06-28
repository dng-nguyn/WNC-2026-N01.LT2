import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import POSPage from './POSPage';
import type { MenuItem, Table, Order } from '../types';

const mockFetchMenuItems = vi.fn();
const mockFetchTables = vi.fn();
const mockCreateOrder = vi.fn();
const mockGetLoggedInUser = vi.fn();

vi.mock('../services/menuItem.service', () => ({
  fetchMenuItems: () => mockFetchMenuItems(),
}));

vi.mock('../services/table.service', () => ({
  fetchTables: () => mockFetchTables(),
}));

vi.mock('../services/order.service', () => ({
  createOrder: (dto: unknown) => mockCreateOrder(dto),
}));

vi.mock('../services/auth.service', () => ({
  getLoggedInUser: () => mockGetLoggedInUser(),
}));

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n).replace(/\u00a0/g, ' ');

async function renderPOS(
  initialItems: MenuItem[] = [],
  initialTables: Table[] = [],
  waitLoading = true
) {
  mockFetchMenuItems.mockResolvedValue(initialItems);
  mockFetchTables.mockResolvedValue(initialTables);
  mockGetLoggedInUser.mockReturnValue({ id: 'u1', username: 'barista' });

  const result = render(
    <MemoryRouter initialEntries={['/pos']}>
      <POSPage />
    </MemoryRouter>
  );

  if (waitLoading) {
    await waitFor(() => {
      expect(screen.queryByText('Loading POS terminal…')).not.toBeInTheDocument();
    });
  }

  return result;
}

function createMockMenuItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: 'mi-1',
    menu: { id: 'm1', name: 'Coffee', description: '', createdAt: new Date().toISOString() },
    name: 'Espresso',
    price: 30000,
    isAvailable: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function createMockTable(overrides: Partial<Table> = {}): Table {
  return {
    id: 't1',
    tableNumber: '1',
    status: 'EMPTY' as const,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('POSPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchMenuItems.mockResolvedValue([]);
    mockFetchTables.mockResolvedValue([]);
    mockCreateOrder.mockResolvedValue({} as Order);
    mockGetLoggedInUser.mockReturnValue({ id: 'u1', username: 'barista' });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows loading state initially', async () => {
    const { promise, resolve } = Promise.withResolvers<MenuItem[]>();
    mockFetchMenuItems.mockReturnValue(promise);
    mockFetchTables.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={['/pos']}>
        <POSPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading POS terminal…')).toBeInTheDocument();
    expect(screen.queryByText('POS Terminal')).not.toBeInTheDocument();

    resolve([]);
    await waitFor(() => expect(screen.queryByText('Loading POS terminal…')).not.toBeInTheDocument());
  });

  it('displays menu item grid', async () => {
    const items = [
      createMockMenuItem({ id: 'mi-1', name: 'Espresso', price: 30000 }),
      createMockMenuItem({ id: 'mi-2', name: 'Latte', price: 40000 }),
    ];
    await renderPOS(items);

    expect(screen.getByText('Espresso')).toBeInTheDocument();
    expect(screen.getByText('Latte')).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(30000))).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(40000))).toBeInTheDocument();
  });

  it('displays category filter tabs (including All)', async () => {
    const items = [
      createMockMenuItem({
        id: 'mi-1',
        name: 'Espresso',
        menu: { id: 'm1', name: 'Coffee', description: '', createdAt: new Date().toISOString() },
      }),
      createMockMenuItem({
        id: 'mi-2',
        name: 'Green Tea',
        menu: { id: 'm2', name: 'Tea', description: '', createdAt: new Date().toISOString() },
      }),
    ];
    await renderPOS(items);

    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Coffee' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tea' })).toBeInTheDocument();
  });

  it('filters items by category on tab click', async () => {
    const user = userEvent.setup();
    const items = [
      createMockMenuItem({
        id: 'mi-1',
        name: 'Espresso',
        menu: { id: 'm1', name: 'Coffee', description: '', createdAt: new Date().toISOString() },
      }),
      createMockMenuItem({
        id: 'mi-2',
        name: 'Green Tea',
        menu: { id: 'm2', name: 'Tea', description: '', createdAt: new Date().toISOString() },
      }),
    ];
    await renderPOS(items);

    expect(screen.getByText('Espresso')).toBeInTheDocument();
    expect(screen.getByText('Green Tea')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Coffee' }));

    expect(screen.getByText('Espresso')).toBeInTheDocument();
    expect(screen.queryByText('Green Tea')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tea' }));

    expect(screen.queryByText('Espresso')).not.toBeInTheDocument();
    expect(screen.getByText('Green Tea')).toBeInTheDocument();
  });

  it('adds item to cart on click', async () => {
    const user = userEvent.setup();
    const items = [createMockMenuItem({ id: 'mi-1', name: 'Espresso', price: 30000 })];
    await renderPOS(items);

    await user.click(screen.getByText('Espresso').closest('button')!);

    expect(screen.getByText('Current Order')).toBeInTheDocument();
    expect(screen.getByText('Total (1 items)')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('increments/decrements quantity in cart', async () => {
    const user = userEvent.setup();
    const items = [createMockMenuItem({ id: 'mi-1', name: 'Espresso', price: 30000 })];
    await renderPOS(items);

    await user.click(screen.getByText('Espresso').closest('button')!);

    expect(screen.getByText('Total (1 items)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '+' }));
    expect(screen.getByText('Total (2 items)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '−' }));
    expect(screen.getByText('Total (1 items)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '−' }));
    expect(screen.queryByText('Total (1 items)')).not.toBeInTheDocument();
    expect(screen.getByText('Click menu items to add them here')).toBeInTheDocument();
  });

  it('shows cart total', async () => {
    const user = userEvent.setup();
    const items = [
      createMockMenuItem({ id: 'mi-1', name: 'Espresso', price: 30000 }),
      createMockMenuItem({ id: 'mi-2', name: 'Latte', price: 40000 }),
    ];
    await renderPOS(items);

    await user.click(screen.getByText('Espresso').closest('button')!);
    await user.click(screen.getByText('Latte').closest('button')!);

    expect(screen.getByText('Total (2 items)')).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(70000))).toBeInTheDocument();
  });

  it('shows Place Order button', async () => {
    await renderPOS([]);
    expect(screen.getByRole('button', { name: 'Place Order' })).toBeInTheDocument();
  });

  it('calls createOrder() on checkout', async () => {
    const user = userEvent.setup();
    const items = [createMockMenuItem({ id: 'mi-1', name: 'Espresso', price: 30000 })];
    const tables = [createMockTable({ id: 't1', tableNumber: '1' })];
    await renderPOS(items, tables);

    await user.click(screen.getByText('Espresso').closest('button')!);

    await user.selectOptions(screen.getByRole('combobox'), 't1');

    await user.click(screen.getByRole('button', { name: 'Place Order' }));

    await waitFor(() => {
      expect(mockCreateOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          tableId: 't1',
          userId: 'u1',
          items: [
            expect.objectContaining({
              menuItemId: 'mi-1',
              quantity: 1,
              note: undefined,
            }),
          ],
        })
      );
    });
  });

  it('shows empty cart message initially', async () => {
    await renderPOS([]);
    expect(screen.getByText('Click menu items to add them here')).toBeInTheDocument();
  });
});