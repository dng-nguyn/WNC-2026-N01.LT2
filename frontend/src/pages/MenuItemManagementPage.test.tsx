import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MenuItemManagementPage from './MenuItemManagementPage';
import type { MenuItem, Menu } from '../types';

const mockFetchMenuItems = vi.fn();
const mockCreateMenuItem = vi.fn();
const mockUpdateMenuItem = vi.fn();
const mockDeleteMenuItem = vi.fn();
const mockFetchMenus = vi.fn();

vi.mock('../services/menuItem.service', () => ({
  fetchMenuItems: () => mockFetchMenuItems(),
  createMenuItem: (dto: unknown) => mockCreateMenuItem(dto),
  updateMenuItem: (id: unknown, dto: unknown) => mockUpdateMenuItem(id, dto),
  deleteMenuItem: (id: unknown) => mockDeleteMenuItem(id),
}));

vi.mock('../services/menu.service', () => ({
  fetchMenus: () => mockFetchMenus(),
}));

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n).replace(/\u00a0/g, ' ');

async function renderMenuItemManagement(
  initialItems: MenuItem[] = [],
  initialMenus: Menu[] = [],
  waitLoading = true
) {
  mockFetchMenuItems.mockResolvedValue(initialItems);
  mockFetchMenus.mockResolvedValue(initialMenus);

  const result = render(
    <MemoryRouter initialEntries={['/menu-items']}>
      <MenuItemManagementPage />
    </MemoryRouter>
  );

  if (waitLoading) {
    await waitFor(() => {
      expect(screen.queryByText('Loading menu items…')).not.toBeInTheDocument();
    });
  }

  return result;
}

function createMockMenu(overrides: Partial<Menu> = {}): Menu {
  return {
    id: 'm1',
    name: 'Coffee',
    description: 'Hot and cold coffee drinks',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function createMockMenuItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: 'mi-1',
    menu: createMockMenu(),
    name: 'Espresso',
    price: 30000,
    isAvailable: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('MenuItemManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchMenuItems.mockResolvedValue([]);
    mockFetchMenus.mockResolvedValue([]);
    mockCreateMenuItem.mockResolvedValue(createMockMenuItem());
    mockUpdateMenuItem.mockResolvedValue(createMockMenuItem());
    mockDeleteMenuItem.mockResolvedValue(undefined);
  });

  it('shows loading state initially', async () => {
    const { promise, resolve } = Promise.withResolvers<MenuItem[]>();
    mockFetchMenuItems.mockReturnValue(promise);
    mockFetchMenus.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={['/menu-items']}>
        <MenuItemManagementPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading menu items…')).toBeInTheDocument();
    expect(screen.queryByText('Menu Items')).not.toBeInTheDocument();

    resolve([]);
    await waitFor(() => expect(screen.queryByText('Loading menu items…')).not.toBeInTheDocument());
  });

  it('displays menu items table with name, category, price, availability', async () => {
    const menus = [createMockMenu({ id: 'm1', name: 'Coffee' })];
    const items = [
      createMockMenuItem({ id: 'mi-1', name: 'Espresso', price: 30000, isAvailable: true, menu: menus[0] }),
      createMockMenuItem({ id: 'mi-2', name: 'Latte', price: 40000, isAvailable: false, menu: menus[0] }),
    ];
    await renderMenuItemManagement(items, menus);

    expect(screen.getByText('Menu Items')).toBeInTheDocument();
    expect(screen.getByText('Espresso')).toBeInTheDocument();
    expect(screen.getByText('Latte')).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(30000))).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(40000))).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  it('shows "No menu items yet" when empty', async () => {
    await renderMenuItemManagement([], []);

    expect(screen.getByText('No menu items yet. Create one above.')).toBeInTheDocument();
  });

  it('opens create form with category dropdown', async () => {
    const user = userEvent.setup();
    const menus = [createMockMenu({ id: 'm1', name: 'Coffee' })];
    await renderMenuItemManagement([], menus);

    await user.click(screen.getByText('+ New Item'));

    expect(screen.getByText('New Menu Item')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Coffee' })).toBeInTheDocument();
  });

  it('validates price input (rejects negative) — shows error', async () => {
    const user = userEvent.setup();
    const menus = [createMockMenu({ id: 'm1', name: 'Coffee' })];
    await renderMenuItemManagement([], menus);

    await user.click(screen.getByText('+ New Item'));

    await user.selectOptions(screen.getByLabelText('Category'), 'm1');
    await user.type(screen.getByLabelText('Name'), 'Negative Price Item');

    // Use fireEvent.change to bypass userEvent number/min typing limitation
    fireEvent.change(screen.getByLabelText('Price (VND)'), { target: { value: '-100' } });

    await user.click(screen.getByText('Save'));

    expect(screen.getByText('Please enter a valid price')).toBeInTheDocument();
    expect(mockCreateMenuItem).not.toHaveBeenCalled();
  });

  it('submits new item via createMenuItem()', async () => {
    const user = userEvent.setup();
    const menus = [createMockMenu({ id: 'm1', name: 'Coffee' })];
    await renderMenuItemManagement([], menus);

    await user.click(screen.getByText('+ New Item'));

    await user.selectOptions(screen.getByLabelText('Category'), 'm1');
    await user.type(screen.getByLabelText('Name'), 'Americano');
    await user.type(screen.getByLabelText('Price (VND)'), '35000');

    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockCreateMenuItem).toHaveBeenCalledWith(
        expect.objectContaining({
          menuId: 'm1',
          name: 'Americano',
          price: 35000,
          isAvailable: true,
        })
      );
    });
  });

  it('opens edit form with pre-filled data', async () => {
    const user = userEvent.setup();
    const menus = [createMockMenu({ id: 'm1', name: 'Coffee' })];
    const items = [createMockMenuItem({ id: 'mi-1', name: 'Espresso', price: 30000, isAvailable: true, menu: menus[0] })];
    await renderMenuItemManagement(items, menus);

    // Click the Edit icon button (first icon-btn in the row)
    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByText('Edit Menu Item')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toHaveValue('m1');
    expect(screen.getByLabelText('Name')).toHaveValue('Espresso');
    expect(screen.getByLabelText('Price (VND)')).toHaveValue(30000);
  });

  it('shows error on fetch failure', async () => {
    mockFetchMenuItems.mockRejectedValue(new Error('Failed to load menu items'));
    mockFetchMenus.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={['/menu-items']}>
        <MenuItemManagementPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load menu items')).toBeInTheDocument();
    });
  });
});
