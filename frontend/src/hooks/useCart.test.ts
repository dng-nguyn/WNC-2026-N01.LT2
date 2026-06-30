import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCart } from './useCart';
import type { MenuItem, Menu } from '../types';

const mockMenu: Menu = { id: 'm1', name: 'Coffee', description: null, createdAt: '2025-01-01' };
const item1: MenuItem = { id: 'i1', name: 'Espresso', price: 45000, isAvailable: true, menu: mockMenu, createdAt: '2025-01-01' };
const item2: MenuItem = { id: 'i2', name: 'Latte', price: 55000, isAvailable: true, menu: mockMenu, createdAt: '2025-01-01' };

const mockCreateOrder = vi.fn();
vi.mock('../services/order.service', () => ({ createOrder: (...args: unknown[]) => mockCreateOrder(...args) }));
vi.mock('../services/auth.service', () => ({ getLoggedInUser: () => ({ id: 'u1', username: 'barista' }) }));

describe('useCart', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('starts with empty cart', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.cart).toEqual([]);
    expect(result.current.cartTotal).toBe(0);
    expect(result.current.cartItemCount).toBe(0);
  });

  it('addToCart adds item', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addToCart(item1));
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].menuItem.id).toBe('i1');
    expect(result.current.cart[0].quantity).toBe(1);
  });

  it('addToCart again increments quantity', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addToCart(item1));
    act(() => result.current.addToCart(item1));
    expect(result.current.cart[0].quantity).toBe(2);
  });

  it('addToCart adds different items separately', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addToCart(item1));
    act(() => result.current.addToCart(item2));
    expect(result.current.cart).toHaveLength(2);
  });

  it('updateQuantity increases quantity', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addToCart(item1));
    act(() => result.current.updateQuantity('i1', 1));
    expect(result.current.cart[0].quantity).toBe(2);
  });

  it('updateQuantity decreases quantity', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addToCart(item1));
    act(() => result.current.addToCart(item1));
    act(() => result.current.updateQuantity('i1', -1));
    expect(result.current.cart[0].quantity).toBe(1);
  });

  it('updateQuantity removes item at 0', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addToCart(item1));
    act(() => result.current.updateQuantity('i1', -1));
    expect(result.current.cart).toHaveLength(0);
  });

  it('cartTotal computes correctly', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addToCart(item1));
    act(() => result.current.addToCart(item2));
    expect(result.current.cartTotal).toBe(100000);
  });

  it('cartItemCount computes correctly', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addToCart(item1));
    act(() => result.current.addToCart(item1));
    act(() => result.current.addToCart(item2));
    expect(result.current.cartItemCount).toBe(3);
  });

  it('clearCart resets everything', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addToCart(item1));
    act(() => result.current.setSelectedTableId('t1'));
    act(() => result.current.clearCart());
    expect(result.current.cart).toEqual([]);
    expect(result.current.selectedTableId).toBe('');
  });

  it('handleCheckout calls createOrder and clears cart', async () => {
    mockCreateOrder.mockResolvedValue({ id: 'o1' });
    const { result } = renderHook(() => useCart());
    act(() => result.current.addToCart(item1));
    await act(async () => { await result.current.handleCheckout(); });
    expect(mockCreateOrder).toHaveBeenCalledOnce();
    expect(result.current.cart).toEqual([]);
    expect(result.current.success).toContain('Order placed');
  });

  it('handleCheckout shows error on failure', async () => {
    mockCreateOrder.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useCart());
    act(() => result.current.addToCart(item1));
    await act(async () => { await result.current.handleCheckout(); });
    expect(result.current.error).toBe('Network error');
  });

  it('handleCheckout shows error when cart is empty', async () => {
    const { result } = renderHook(() => useCart());
    await act(async () => { await result.current.handleCheckout(); });
    expect(result.current.error).toBe('Cart is empty');
  });
});
