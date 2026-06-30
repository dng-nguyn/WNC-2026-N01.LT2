import { useEffect, useState, useCallback } from 'react';
import {
  fetchOrders as apiFetchOrders,
  fetchOrder as apiFetchOrder,
  createOrder as apiCreateOrder,
  updateOrder as apiUpdateOrder,
  deleteOrder as apiDeleteOrder,
} from '../services/order.service';
import type { Order, CreateOrderDto, UpdateOrderDto } from '../types';

interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
  fetchOrder: (id: string) => Promise<Order>;
  createOrder: (dto: CreateOrderDto) => Promise<Order>;
  updateOrder: (id: string, dto: UpdateOrderDto) => Promise<Order>;
  deleteOrder: (id: string) => Promise<void>;
}

export function useOrders(): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetchOrders();
      setOrders(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load orders',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const fetchOrder = useCallback(async (id: string): Promise<Order> => {
    return apiFetchOrder(id);
  }, []);

  const createOrder = useCallback(
    async (dto: CreateOrderDto): Promise<Order> => {
      const order = await apiCreateOrder(dto);
      await loadOrders();
      return order;
    },
    [loadOrders],
  );

  const updateOrder = useCallback(
    async (id: string, dto: UpdateOrderDto): Promise<Order> => {
      const order = await apiUpdateOrder(id, dto);
      await loadOrders();
      return order;
    },
    [loadOrders],
  );

  const deleteOrder = useCallback(
    async (id: string): Promise<void> => {
      await apiDeleteOrder(id);
      await loadOrders();
    },
    [loadOrders],
  );

  return {
    orders,
    loading,
    error,
    refetch: loadOrders,
    fetchOrder,
    createOrder,
    updateOrder,
    deleteOrder,
  };
}
