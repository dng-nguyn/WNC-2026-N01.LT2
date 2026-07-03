import { get, post, patch, del } from './api';
import type {
  Order,
  CreateOrderDto,
  CreateOrderItemDto,
  UpdateOrderDto,
} from '../types';

export async function fetchOrders(): Promise<Order[]> {
  return get<Order[]>('/orders');
}

export async function fetchActiveOrders(): Promise<Order[]> {
  return get<Order[]>('/orders/active');
}

export async function fetchOrder(id: string): Promise<Order> {
  return get<Order>(`/orders/${id}`);
}

export async function createOrder(dto: CreateOrderDto): Promise<Order> {
  return post<Order>('/orders', dto);
}

export async function updateOrder(
  id: string,
  dto: UpdateOrderDto,
): Promise<Order> {
  return patch<Order>(`/orders/${id}`, dto);
}

export async function deleteOrder(id: string): Promise<void> {
  return del(`/orders/${id}`);
}

export async function addOrderItem(
  orderId: string,
  dto: CreateOrderItemDto,
): Promise<Order> {
  return post<Order>(`/orders/${orderId}/items`, dto);
}
