import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMenuCategories } from './useMenuCategories';
import type { Menu } from '../types';

const mockMenu: Menu = { id: 'm1', name: 'Coffee', description: 'Hot drinks', createdAt: '2025-01-01' };

const mockFetch = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
vi.mock('../services/menu.service', () => ({
  fetchMenus: () => mockFetch(),
  createMenu: (dto: unknown) => mockCreate(dto),
  updateMenu: (id: unknown, dto: unknown) => mockUpdate(id, dto),
  deleteMenu: (id: unknown) => mockDelete(id),
}));

describe('useMenuCategories', () => {
  beforeEach(() => { vi.clearAllMocks(); mockFetch.mockResolvedValue([mockMenu]); });

  it('loads menus on mount', async () => {
    const { result } = renderHook(() => useMenuCategories());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.menus).toHaveLength(1);
    expect(result.current.menus[0].name).toBe('Coffee');
  });

  it('handles fetch error', async () => {
    mockFetch.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useMenuCategories());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('fail');
  });

  it('createMenu calls API and refetches', async () => {
    mockCreate.mockResolvedValue(mockMenu);
    const { result } = renderHook(() => useMenuCategories());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.createMenu({ name: 'Tea' }); });
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('updateMenu calls API and refetches', async () => {
    mockUpdate.mockResolvedValue(mockMenu);
    const { result } = renderHook(() => useMenuCategories());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.updateMenu('m1', { name: 'Updated' }); });
    expect(mockUpdate).toHaveBeenCalledWith('m1', { name: 'Updated' });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('deleteMenu calls API and refetches', async () => {
    mockDelete.mockResolvedValue(undefined);
    const { result } = renderHook(() => useMenuCategories());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.deleteMenu('m1'); });
    expect(mockDelete).toHaveBeenCalledWith('m1');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('refetch reloads data', async () => {
    const { result } = renderHook(() => useMenuCategories());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.refetch(); });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
