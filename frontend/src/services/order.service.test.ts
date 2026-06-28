import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();
const mockDel = vi.fn();

vi.mock('./api', () => ({
  get: (...args: unknown[]) => mockGet(...args),
  post: (...args: unknown[]) => mockPost(...args),
  patch: (...args: unknown[]) => mockPatch(...args),
  del: (...args: unknown[]) => mockDel(...args),
}));

import {
  fetchOrders,
  fetchOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  addOrderItem,
} from './order.service';

describe('order.service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    mockGet.mockReset();
    mockPost.mockReset();
    mockPatch.mockReset();
    mockDel.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchOrders calls GET /orders', async () => {
    const expected = [
      {
        id: '1',
        table: null,
        user: { id: '1', username: 'user1', createdAt: '2024-01-01T00:00:00.000Z' },
        status: 'PENDING',
        totalAmount: 10,
        items: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];
    mockGet.mockResolvedValue(expected);

    const result = await fetchOrders();

    expect(mockGet).toHaveBeenCalledWith('/orders');
    expect(result).toEqual(expected);
  });

  it('fetchOrder calls GET /orders/:id', async () => {
    const expected = {
      id: '1',
      table: null,
      user: { id: '1', username: 'user1', createdAt: '2024-01-01T00:00:00.000Z' },
      status: 'PENDING',
      totalAmount: 10,
      items: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    mockGet.mockResolvedValue(expected);

    const result = await fetchOrder('1');

    expect(mockGet).toHaveBeenCalledWith('/orders/1');
    expect(result).toEqual(expected);
  });

  it('createOrder calls POST /orders with dto', async () => {
    const dto = { tableId: '1', userId: '1', items: [{ menuItemId: '1', quantity: 2, note: 'hot' }] };
    const expected = {
      id: '2',
      table: { id: '1', tableNumber: 'A1', status: 'OCCUPIED', createdAt: '2024-01-01T00:00:00.000Z' },
      user: { id: '1', username: 'user1', createdAt: '2024-01-01T00:00:00.000Z' },
      status: 'PENDING',
      totalAmount: 10,
      items: [{ id: '1', menuItem: { id: '1', menu: { id: '1', name: '', description: null, createdAt: '' }, name: 'Espresso', price: 5, isAvailable: true, createdAt: '' }, quantity: 2, price: 5, note: 'hot' }],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    mockPost.mockResolvedValue(expected);

    const result = await createOrder(dto);

    expect(mockPost).toHaveBeenCalledWith('/orders', dto);
    expect(result).toEqual(expected);
  });

  it('updateOrder calls PATCH /orders/:id with dto', async () => {
    const dto = { status: 'COMPLETED' as const };
    const expected = {
      id: '1',
      table: null,
      user: { id: '1', username: 'user1', createdAt: '2024-01-01T00:00:00.000Z' },
      status: 'COMPLETED',
      totalAmount: 10,
      items: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    mockPatch.mockResolvedValue(expected);

    const result = await updateOrder('1', dto);

    expect(mockPatch).toHaveBeenCalledWith('/orders/1', dto);
    expect(result).toEqual(expected);
  });

  it('deleteOrder calls DELETE /orders/:id', async () => {
    mockDel.mockResolvedValue(undefined);

    await deleteOrder('1');

    expect(mockDel).toHaveBeenCalledWith('/orders/1');
  });

  it('addOrderItem calls POST /orders/:orderId/items with dto', async () => {
    const dto = { menuItemId: '1', quantity: 1, note: 'extra hot' };
    const expected = {
      id: '1',
      table: null,
      user: { id: '1', username: 'user1', createdAt: '2024-01-01T00:00:00.000Z' },
      status: 'PENDING',
      totalAmount: 15,
      items: [
        { id: '1', menuItem: { id: '1', menu: { id: '1', name: '', description: null, createdAt: '' }, name: 'Espresso', price: 5, isAvailable: true, createdAt: '' }, quantity: 2, price: 5, note: 'hot' },
        { id: '2', menuItem: { id: '1', menu: { id: '1', name: '', description: null, createdAt: '' }, name: 'Espresso', price: 5, isAvailable: true, createdAt: '' }, quantity: 1, price: 5, note: 'extra hot' },
      ],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    mockPost.mockResolvedValue(expected);

    const result = await addOrderItem('1', dto);

    expect(mockPost).toHaveBeenCalledWith('/orders/1/items', dto);
    expect(result).toEqual(expected);
  });
});