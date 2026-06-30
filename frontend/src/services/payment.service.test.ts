import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const mockPost = vi.fn();
const mockGet = vi.fn();

vi.mock('./api', () => ({
  post: (...args: unknown[]) => mockPost(...args),
  get: (...args: unknown[]) => mockGet(...args),
}));

import {
  createPayment,
  getPayment,
  getPaymentsByOrder,
  verifyPayment,
} from './payment.service';
import type { Payment } from '../types';

describe('payment.service', () => {
  const mockPayment: Payment = {
    id: 'pay-1',
    order: {
      id: 'order-1',
      table: { id: 'table-1', tableNumber: '1', status: 'OCCUPIED', createdAt: '2024-01-01T00:00:00.000Z' },
      user: { id: 'user-1', username: 'user1', fullName: 'User One', role: 'STAFF', isActive: true, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
      status: 'COMPLETED',
      totalAmount: 50,
      items: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    code: 'PAY001',
    amount: 50,
    status: 'COMPLETED',
    qrUrl: 'https://example.com/qr.png',
    sepayTransactionId: 'txn-123',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockPost.mockReset();
    mockGet.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createPayment', () => {
    it('calls POST /payments/qr with orderId and returns Payment', async () => {
      mockPost.mockResolvedValue(mockPayment);

      const result = await createPayment('order-1');

      expect(mockPost).toHaveBeenCalledWith('/payments/qr', { orderId: 'order-1' });
      expect(result).toEqual(mockPayment);
    });
  });

  describe('getPayment', () => {
    it('calls GET /payments/:id and returns Payment', async () => {
      mockGet.mockResolvedValue(mockPayment);

      const result = await getPayment('pay-1');

      expect(mockGet).toHaveBeenCalledWith('/payments/pay-1');
      expect(result).toEqual(mockPayment);
    });
  });

  describe('getPaymentsByOrder', () => {
    it('calls GET /payments/order/:orderId and returns Payment[]', async () => {
      const payments = [mockPayment];
      mockGet.mockResolvedValue(payments);

      const result = await getPaymentsByOrder('order-1');

      expect(mockGet).toHaveBeenCalledWith('/payments/order/order-1');
      expect(result).toEqual(payments);
    });
  });

  describe('verifyPayment', () => {
    it('calls POST /payments/:id/verify and returns Payment', async () => {
      mockPost.mockResolvedValue(mockPayment);

      const result = await verifyPayment('pay-1');

      expect(mockPost).toHaveBeenCalledWith('/payments/pay-1/verify');
      expect(result).toEqual(mockPayment);
    });
  });
});