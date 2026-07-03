import { post, get } from './api';
import type { Payment } from '../types';

/**
 * Create a payment request with VietQR for a given order.
 * POST /payments/qr  { orderId }
 */
export async function createPayment(orderId: string): Promise<Payment> {
  return post<Payment>('/payments/qr', { orderId });
}

/**
 * Get a payment by its ID.
 * GET /payments/:id
 */
export async function getPayment(id: string): Promise<Payment> {
  return get<Payment>(`/payments/${id}`);
}

/**
 * Get all payments for a specific order.
 * GET /payments/order/:orderId
 */
export async function getPaymentsByOrder(orderId: string): Promise<Payment[]> {
  return get<Payment[]>(`/payments/order/${orderId}`);
}

/**
 * Verify a payment via Sepay API.
 * POST /payments/:id/verify
 */
export async function verifyPayment(id: string): Promise<Payment> {
  return post<Payment>(`/payments/${id}/verify`);
}

/**
 * Mark a payment as manually verified.
 * POST /payments/:id/mark-manual
 */
export async function markManualPayment(id: string): Promise<Payment> {
  return post<Payment>(`/payments/${id}/mark-manual`);
}
