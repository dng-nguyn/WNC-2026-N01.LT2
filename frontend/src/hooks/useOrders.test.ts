import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useOrders } from './useOrders';
import type { Order, OrderStatus } from '../types';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o1', table: null, user: { id: 'u1', username: 'barista' } as Order['user'],
    status: 'COMPLETED' as OrderStatus, totalAmount: 100000,
    items: [], createdAt: '2025-01-01', updatedAt: '2025-01-01', ...overrides,
  };
}

const mockFetchAll = vi.fn();
const mockFetchOne = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
vi.mock('../services/order.service', () => ({
  fetchOrders: () => mockFetchAll(),
  fetchOrder: (id: unknown) => mockFetchOne(id),
  createOrder: (dto: unknown) => mockCreate(dto),
  updateOrder: (id: unknown, dto: unknown) => mockUpdate(id, dto),
  deleteOrder: (id: unknown) => mockDelete(id),
}));

describe('useOrders', () => {
  beforeEach(() => { vi.clearAllMocks(); mockFetchAll.mockResolvedValue([makeOrder()]); });

  it('loads orders on mount', async () => {
    const { result } = renderHook(() => useOrders());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.orders).toHaveLength(1);
  });

  it('handles fetch error', async () => {
    mockFetchAll.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useOrders());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('fail');
  });

  it('fetchOrder calls API', async () => {
    mockFetchOne.mockResolvedValue(makeOrder());
    const { result } = renderHook(() => useOrders());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const order = await result.current.fetchOrder('o1');
    expect(mockFetchOne).toHaveBeenCalledWith('o1');
    expect(order.id).toBe('o1');
  });

  it('createOrder calls API and refetches', async () => {
    mockCreate.mockResolvedValue(makeOrder());
    const { result } = renderHook(() => useOrders());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.createOrder({ userId: 'u1', items: [] }); });
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockFetchAll).toHaveBeenCalledTimes(2);
  });

  it('updateOrder calls API and refetches', async () => {
    mockUpdate.mockResolvedValue(makeOrder());
    const { result } = renderHook(() => useOrders());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.updateOrder('o1', { status: 'COMPLETED' as OrderStatus }); });
    expect(mockUpdate).toHaveBeenCalledOnce();
    expect(mockFetchAll).toHaveBeenCalledTimes(2);
  });

  it('deleteOrder calls API and refetches', async () => {
    mockDelete.mockResolvedValue(undefined);
    const { result } = renderHook(() => useOrders());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.deleteOrder('o1'); });
    expect(mockDelete).toHaveBeenCalledWith('o1');
    expect(mockFetchAll).toHaveBeenCalledTimes(2);
  });

  it('refetch reloads data', async () => {
    const { result } = renderHook(() => useOrders());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.refetch(); });
    expect(mockFetchAll).toHaveBeenCalledTimes(2);
  });
});
