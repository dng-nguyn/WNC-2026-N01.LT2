import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMenuItems } from './useMenuItems';
import type { MenuItem, Menu } from '../types';

const mockMenu: Menu = { id: 'm1', name: 'Coffee', description: null, createdAt: '2025-01-01' };
const mockItem: MenuItem = { id: 'i1', name: 'Espresso', price: 45000, isAvailable: true, menu: mockMenu, createdAt: '2025-01-01' };

const mockFetch = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
vi.mock('../services/menuItem.service', () => ({
  fetchMenuItems: () => mockFetch(),
  createMenuItem: (dto: unknown) => mockCreate(dto),
  updateMenuItem: (id: unknown, dto: unknown) => mockUpdate(id, dto),
  deleteMenuItem: (id: unknown) => mockDelete(id),
}));

describe('useMenuItems', () => {
  beforeEach(() => { vi.clearAllMocks(); mockFetch.mockResolvedValue([mockItem]); });

  it('loads items on mount', async () => {
    const { result } = renderHook(() => useMenuItems());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('Espresso');
  });

  it('handles fetch error', async () => {
    mockFetch.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useMenuItems());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('fail');
  });

  it('createItem calls API and refetches', async () => {
    mockCreate.mockResolvedValue(mockItem);
    const { result } = renderHook(() => useMenuItems());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.createItem({ menuId: 'm1', name: 'New', price: 30000 }); });
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('updateItem calls API and refetches', async () => {
    mockUpdate.mockResolvedValue(mockItem);
    const { result } = renderHook(() => useMenuItems());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.updateItem('i1', { name: 'Updated' }); });
    expect(mockUpdate).toHaveBeenCalledWith('i1', { name: 'Updated' });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('deleteItem calls API and refetches', async () => {
    mockDelete.mockResolvedValue(undefined);
    const { result } = renderHook(() => useMenuItems());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.deleteItem('i1'); });
    expect(mockDelete).toHaveBeenCalledWith('i1');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('refetch reloads data', async () => {
    const { result } = renderHook(() => useMenuItems());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.refetch(); });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
