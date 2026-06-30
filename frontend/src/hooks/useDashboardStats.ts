import { useEffect, useState, useCallback } from 'react';
import { fetchOrders } from '../services/order.service';
import type { Order } from '../types';

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  topItems: { name: string; quantity: number; revenue: number }[];
}

interface UseDashboardStatsReturn {
  stats: DashboardStats | null;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
}

function computeStats(orders: Order[]): DashboardStats {
  const itemMap = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >();

  let totalRevenue = 0;
  let completedOrders = 0;
  let pendingOrders = 0;

  for (const order of orders) {
    totalRevenue += Number(order.totalAmount);

    if (order.status === 'COMPLETED') completedOrders++;
    if (order.status === 'PENDING') pendingOrders++;

    for (const item of order.items) {
      const existing = itemMap.get(item.menuItem.name);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.quantity * Number(item.price);
      } else {
        itemMap.set(item.menuItem.name, {
          name: item.menuItem.name,
          quantity: item.quantity,
          revenue: item.quantity * Number(item.price),
        });
      }
    }
  }

  const topItems = [...itemMap.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return {
    totalRevenue,
    totalOrders: orders.length,
    completedOrders,
    pendingOrders,
    averageOrderValue:
      orders.length > 0 ? totalRevenue / orders.length : 0,
    topItems,
  };
}

export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const orders = await fetchOrders();
      const computed = computeStats(orders);
      setStats(computed);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load dashboard',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, loading, error, refetch: loadStats };
}
