import { get, post, patch, del } from './api';
import type { MenuItem, CreateMenuItemDto, UpdateMenuItemDto } from '../types';

export async function fetchMenuItems(): Promise<MenuItem[]> {
  return get<MenuItem[]>('/menu-items');
}

export async function fetchMenuItem(id: string): Promise<MenuItem> {
  return get<MenuItem>(`/menu-items/${id}`);
}

export async function createMenuItem(
  dto: CreateMenuItemDto,
): Promise<MenuItem> {
  return post<MenuItem>('/menu-items', dto);
}

export async function updateMenuItem(
  id: string,
  dto: UpdateMenuItemDto,
): Promise<MenuItem> {
  return patch<MenuItem>(`/menu-items/${id}`, dto);
}

export async function deleteMenuItem(id: string): Promise<void> {
  return del(`/menu-items/${id}`);
}
