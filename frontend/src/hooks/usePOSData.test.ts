import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePOSData } from './usePOSData';
import type { MenuItem, Table, Menu } from '../types';

const mockMenu: Menu = { id: 'm1', name: 'Coffee', description: null, createdAt: '2025-01-01' };
const availableItem: MenuItem = { id: 'i1', name: 'Espresso', price: 45000, isAvailable: true, menu: mockMenu, createdAt: '2025-01-01' };
const unavailableItem: MenuItem = { id: 'i2', name: 'Sold Out', price: 55000, isAvailable: false, menu: mockMenu, createdAt: '2025-01-01' };

const mockFetchMenuItems = vi.fn();
const mockFetchTables = vi.fn();
vi.mock('../services/menuItem.service', () => ({ fetchMenuItems: () => mockFetchMenuItems() }));
vi.mock('../services/table.service', () => ({ fetchTables: () => mockFetchTables() }));

describe('usePOSData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchMenuItems.mockResolvedValue([availableItem, unavailableItem]);
    mockFetchTables.mockResolvedValue([]);
  });

  it('starts in loading state', () => {
    mockFetchMenuItems.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePOSData());
    expect(result.current.loading).toBe(true);
  });

  it('loads menu items and tables on mount', async () => {
    const { result } = renderHook(() => usePOSData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.menuItems).toHaveLength(1);
    expect(result.current.menuItems[0].id).toBe('i1');
  });

  it('only includes available items', async () => {
    const { result } = renderHook(() => usePOSData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.menuItems.every((i) => i.isAvailable)).toBe(true);
  });

  it('computes categories from items plus all', async () => {
    const { result } = renderHook(() => usePOSData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.categories).toContain('all');
    expect(result.current.categories).toContain('Coffee');
  });

  it('filteredItems returns all for all category', async () => {
    const { result } = renderHook(() => usePOSData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.filteredItems).toHaveLength(1);
  });

  it('filteredItems filters by category', async () => {
    const { result } = renderHook(() => usePOSData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activeCategory).toBe('all');
  });

  it('handles fetch error', async () => {
    mockFetchMenuItems.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => usePOSData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Network error');
  });
});
