import { useState, useEffect, useCallback } from 'react';
import {
  fetchMenuItems as apiFetchMenuItems,
  createMenuItem as apiCreateMenuItem,
  updateMenuItem as apiUpdateMenuItem,
  deleteMenuItem as apiDeleteMenuItem,
} from '../services/menuItem.service';
import type { MenuItem, CreateMenuItemDto, UpdateMenuItemDto } from '../types';

interface UseMenuItemsReturn {
  items: MenuItem[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
  createItem: (dto: CreateMenuItemDto) => Promise<MenuItem>;
  updateItem: (id: string, dto: UpdateMenuItemDto) => Promise<MenuItem>;
  deleteItem: (id: string) => Promise<void>;
}

export function useMenuItems(): UseMenuItemsReturn {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetchMenuItems();
      setItems(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load menu items',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const createItem = useCallback(
    async (dto: CreateMenuItemDto): Promise<MenuItem> => {
      const item = await apiCreateMenuItem(dto);
      await loadItems();
      return item;
    },
    [loadItems],
  );

  const updateItem = useCallback(
    async (id: string, dto: UpdateMenuItemDto): Promise<MenuItem> => {
      const item = await apiUpdateMenuItem(id, dto);
      await loadItems();
      return item;
    },
    [loadItems],
  );

  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      await apiDeleteMenuItem(id);
      await loadItems();
    },
    [loadItems],
  );

  return { items, loading, error, refetch: loadItems, createItem, updateItem, deleteItem };
}
