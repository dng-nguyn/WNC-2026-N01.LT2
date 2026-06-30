import { useEffect, useState, useMemo, useCallback } from 'react';
import { fetchMenuItems } from '../services/menuItem.service';
import { fetchTables } from '../services/table.service';
import type { MenuItem, Table } from '../types';

interface UsePOSDataReturn {
  menuItems: MenuItem[];
  tables: Table[];
  categories: string[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  filteredItems: MenuItem[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
}

export function usePOSData(): UsePOSDataReturn {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [items, tabs] = await Promise.all([
        fetchMenuItems(),
        fetchTables(),
      ]);
      setMenuItems(items.filter((i) => i.isAvailable));
      setTables(tabs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map((i) => i.menu.name));
    return ['all', ...cats];
  }, [menuItems]);

  const filteredItems = useMemo(
    () =>
      activeCategory === 'all'
        ? menuItems
        : menuItems.filter((i) => i.menu.name === activeCategory),
    [menuItems, activeCategory],
  );

  return {
    menuItems,
    tables,
    categories,
    activeCategory,
    setActiveCategory,
    filteredItems,
    loading,
    error,
    refetch: loadData,
  };
}
