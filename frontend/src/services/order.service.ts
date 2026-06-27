import apiClient from './api';
import { Order, OrderStatus } from '../types';

export interface CreateOrderPayload {
  tableId?: string;
  userId: string;
  items: { menuItemId: string; quantity: number }[];
}

export const createOrder = async (data: CreateOrderPayload): Promise<Order> => {
  const response = await apiClient.post('/orders', data);
  return response.data;
};

export const getOrders = async (params?: {
  status?: OrderStatus;
  userId?: string;
  tableId?: string;
}): Promise<Order[]> => {
  const response = await apiClient.get('/orders', { params });
  return response.data;
};

export const getOrder = async (id: string): Promise<Order> => {
  const response = await apiClient.get(`/orders/${id}`);
  return response.data;
};

export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<Order> => {
  const response = await apiClient.patch(`/orders/${id}/status`, { status });
  return response.data;
};
