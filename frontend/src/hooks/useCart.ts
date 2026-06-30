import { useState, useMemo, useCallback } from 'react';
import { createOrder } from '../services/order.service';
import { getLoggedInUser } from '../services/auth.service';
import type { MenuItem } from '../types';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  note: string;
}

interface UseCartReturn {
  cart: CartItem[];
  selectedTableId: string;
  setSelectedTableId: (id: string) => void;
  cartTotal: number;
  cartItemCount: number;
  submitting: boolean;
  error: string;
  success: string;
  addToCart: (item: MenuItem) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  updateNote: (itemId: string, note: string) => void;
  clearCart: () => void;
  handleCheckout: () => Promise<void>;
  clearMessages: () => void;
}

export function useCart(): UseCartReturn {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const user = getLoggedInUser();

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * Number(item.menuItem.price), 0),
    [cart],
  );

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const addToCart = useCallback((menuItem: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === menuItem.id
            ? { ...c, quantity: c.quantity + 1 }
            : c,
        );
      }
      return [...prev, { menuItem, quantity: 1, note: '' }];
    });
    setError('');
    setSuccess('');
  }, []);

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuItem.id === itemId
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c,
        )
        .filter((c) => c.quantity > 0),
    );
  }, []);

  const updateNote = useCallback((itemId: string, note: string) => {
    setCart((prev) =>
      prev.map((c) =>
        c.menuItem.id === itemId ? { ...c, note } : c,
      ),
    );
  }, []);

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedTableId('');
    setSuccess('');
    setError('');
  }, []);

  const handleCheckout = useCallback(async () => {
    if (!user) {
      setError('You must be logged in to place an order');
      return;
    }
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await createOrder({
        userId: user.id,
        tableId: selectedTableId || undefined,
        items: cart.map((c) => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity,
          note: c.note || undefined,
        })),
      });
      const total = cart.reduce(
        (sum, item) => sum + item.quantity * Number(item.menuItem.price),
        0,
      );
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      setSuccess(
        `Order placed successfully! ${count} item(s) — ${new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(total)}`,
      );
      setCart([]);
      setSelectedTableId('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  }, [cart, selectedTableId, user]);

  return {
    cart,
    selectedTableId,
    setSelectedTableId,
    cartTotal,
    cartItemCount,
    submitting,
    error,
    success,
    addToCart,
    updateQuantity,
    updateNote,
    clearCart,
    handleCheckout,
    clearMessages,
  };
}
