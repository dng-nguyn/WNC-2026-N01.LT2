import { useState, useEffect, useCallback } from 'react';
import {
  fetchMenus as apiFetchMenus,
  createMenu as apiCreateMenu,
  updateMenu as apiUpdateMenu,
  deleteMenu as apiDeleteMenu,
} from '../services/menu.service';
import type { Menu, CreateMenuDto, UpdateMenuDto } from '../types';

interface UseMenuCategoriesReturn {
  menus: Menu[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
  createMenu: (dto: CreateMenuDto) => Promise<Menu>;
  updateMenu: (id: string, dto: UpdateMenuDto) => Promise<Menu>;
  deleteMenu: (id: string) => Promise<void>;
}

export function useMenuCategories(): UseMenuCategoriesReturn {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMenus = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetchMenus();
      setMenus(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load menus',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenus();
  }, [loadMenus]);

  const createMenu = useCallback(
    async (dto: CreateMenuDto): Promise<Menu> => {
      const menu = await apiCreateMenu(dto);
      await loadMenus();
      return menu;
    },
    [loadMenus],
  );

  const updateMenu = useCallback(
    async (id: string, dto: UpdateMenuDto): Promise<Menu> => {
      const menu = await apiUpdateMenu(id, dto);
      await loadMenus();
      return menu;
    },
    [loadMenus],
  );

  const deleteMenu = useCallback(
    async (id: string): Promise<void> => {
      await apiDeleteMenu(id);
      await loadMenus();
    },
    [loadMenus],
  );

  return { menus, loading, error, refetch: loadMenus, createMenu, updateMenu, deleteMenu };
}
