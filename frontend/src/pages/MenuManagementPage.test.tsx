import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import MenuManagementPage from './MenuManagementPage';
import type { Menu } from '../types';

const mockFetchMenus = vi.fn();
const mockCreateMenu = vi.fn();
const mockUpdateMenu = vi.fn();
const mockDeleteMenu = vi.fn();

vi.mock('../services/menu.service', () => ({
  fetchMenus: () => mockFetchMenus(),
  createMenu: (dto: unknown) => mockCreateMenu(dto),
  updateMenu: (id: unknown, dto: unknown) => mockUpdateMenu(id, dto),
  deleteMenu: (id: unknown) => mockDeleteMenu(id),
}));

async function renderMenuManagement(initialMenus: Menu[] = [], waitLoading = true) {
  mockFetchMenus.mockResolvedValue(initialMenus);

  const result = render(
    <MemoryRouter initialEntries={['/menus']}>
      <MenuManagementPage />
    </MemoryRouter>
  );

  if (waitLoading) {
    await waitFor(() => {
      expect(screen.queryByText('Loading menus…')).not.toBeInTheDocument();
    });
  }

  return result;
}

function createMockMenu(overrides: Partial<Menu> = {}): Menu {
  return {
    id: 'menu-1',
    name: 'Coffee',
    description: 'Hot and cold coffee drinks',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('MenuManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchMenus.mockResolvedValue([]);
    mockCreateMenu.mockResolvedValue(createMockMenu());
    mockUpdateMenu.mockResolvedValue(createMockMenu());
    mockDeleteMenu.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows loading state initially', async () => {
    const { promise, resolve } = Promise.withResolvers<Menu[]>();
    mockFetchMenus.mockReturnValue(promise);

    render(
      <MemoryRouter initialEntries={['/menus']}>
        <MenuManagementPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading menus…')).toBeInTheDocument();
    expect(screen.queryByText('Menu Categories')).not.toBeInTheDocument();

    resolve([]);
    await waitFor(() => expect(screen.queryByText('Loading menus…')).not.toBeInTheDocument());
  });

  it('displays menu categories table', async () => {
    const menus = [
      createMockMenu({ id: 'm1', name: 'Coffee', description: 'Hot coffee' }),
      createMockMenu({ id: 'm2', name: 'Tea', description: 'Various teas' }),
    ];
    await renderMenuManagement(menus);

    expect(screen.getByText('Menu Categories')).toBeInTheDocument();
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Tea')).toBeInTheDocument();
    expect(screen.getByText('Hot coffee')).toBeInTheDocument();
    expect(screen.getByText('Various teas')).toBeInTheDocument();
  });

  it('shows "No categories yet" when empty', async () => {
    await renderMenuManagement([]);

    expect(screen.getByText('No categories yet. Create one above.')).toBeInTheDocument();
  });

  it('opens create form on + New Category click', async () => {
    const user = userEvent.setup();
    await renderMenuManagement([]);

    await user.click(screen.getByText('+ New Category'));

    expect(screen.getByText('New Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('submits new menu via createMenu()', async () => {
    const user = userEvent.setup();
    await renderMenuManagement([]);

    await user.click(screen.getByText('+ New Category'));

    await user.type(screen.getByLabelText('Name *'), 'Desserts');
    await user.type(screen.getByLabelText('Description'), 'Sweet treats');

    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockCreateMenu).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Desserts',
          description: 'Sweet treats',
        })
      );
    });
  });

  it('opens edit form with pre-filled data', async () => {
    const user = userEvent.setup();
    const menus = [createMockMenu({ id: 'm1', name: 'Coffee', description: 'Hot coffee' })];
    await renderMenuManagement(menus);

    await user.click(screen.getByText('Edit'));

    expect(screen.getByText('Edit Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Name *')).toHaveValue('Coffee');
    expect(screen.getByLabelText('Description')).toHaveValue('Hot coffee');
  });

  it('submits edit via updateMenu()', async () => {
    const user = userEvent.setup();
    const menus = [createMockMenu({ id: 'm1', name: 'Coffee', description: 'Hot coffee' })];
    await renderMenuManagement(menus);

    await user.click(screen.getByText('Edit'));

    await user.clear(screen.getByLabelText('Name *'));
    await user.type(screen.getByLabelText('Name *'), 'Specialty Coffee');

    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockUpdateMenu).toHaveBeenCalledWith(
        'm1',
        expect.objectContaining({
          name: 'Specialty Coffee',
          description: 'Hot coffee',
        })
      );
    });
  });

  it('shows error on fetch failure', async () => {
    mockFetchMenus.mockRejectedValue(new Error('Failed to load'));

    render(
      <MemoryRouter initialEntries={['/menus']}>
        <MenuManagementPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });
});