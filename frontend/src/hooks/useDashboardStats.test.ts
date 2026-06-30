import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardStats } from './useDashboardStats';
import type { Order, OrderStatus } from '../types';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o1', table: null, user: { id: 'u1', username: 'barista' } as Order['user'],
    status: 'COMPLETED' as OrderStatus, totalAmount: 100000,
    items: [{ id: 'oi1', menuItem: { id: 'i1', name: 'Espresso' } as Order['items'][0]['menuItem'], quantity: 2, price: 50000, note: null }],
    createdAt: '2025-01-01', updatedAt: '2025-01-01', ...overrides,
  };
}

const mockFetchOrders = vi.fn();
vi.mock('../services/order.service', () => ({ fetchOrders: () => mockFetchOrders() }));

describe('useDashboardStats', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('starts in loading state', () => {
    mockFetchOrders.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useDashboardStats());
    expect(result.current.loading).toBe(true);
  });

  it('computes stats from orders', async () => {
    mockFetchOrders.mockResolvedValue([makeOrder(), makeOrder({ id: 'o2', status: 'PENDING' as OrderStatus, totalAmount: 50000 })]);
    const { result } = renderHook(() => useDashboardStats());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).not.toBeNull();
    expect(result.current.stats!.totalOrders).toBe(2);
    expect(result.current.stats!.totalRevenue).toBe(150000);
    expect(result.current.stats!.completedOrders).toBe(1);
    expect(result.current.stats!.pendingOrders).toBe(1);
  });

  it('computes averageOrderValue', async () => {
    mockFetchOrders.mockResolvedValue([makeOrder({ totalAmount: 100000 }), makeOrder({ id: 'o2', totalAmount: 200000 })]);
    const { result } = renderHook(() => useDashboardStats());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats!.averageOrderValue).toBe(150000);
  });

  it('computes topItems sorted by quantity', async () => {
    mockFetchOrders.mockResolvedValue([makeOrder()]);
    const { result } = renderHook(() => useDashboardStats());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats!.topItems).toHaveLength(1);
    expect(result.current.stats!.topItems[0].name).toBe('Espresso');
    expect(result.current.stats!.topItems[0].quantity).toBe(2);
  });

  it('handles fetch error', async () => {
    mockFetchOrders.mockRejectedValue(new Error('DB error'));
    const { result } = renderHook(() => useDashboardStats());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('DB error');
    expect(result.current.stats).toBeNull();
  });

  it('handles empty orders', async () => {
    mockFetchOrders.mockResolvedValue([]);
    const { result } = renderHook(() => useDashboardStats());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats!.totalOrders).toBe(0);
    expect(result.current.stats!.totalRevenue).toBe(0);
    expect(result.current.stats!.averageOrderValue).toBe(0);
    expect(result.current.stats!.topItems).toEqual([]);
  });
});
