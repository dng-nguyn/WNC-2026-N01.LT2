import { get, post, patch, del } from './api';
import type { Menu, CreateMenuDto, UpdateMenuDto } from '../types';

export async function fetchMenus(): Promise<Menu[]> {
  return get<Menu[]>('/menus');
}

export async function fetchMenu(id: string): Promise<Menu> {
  return get<Menu>(`/menus/${id}`);
}

export async function createMenu(dto: CreateMenuDto): Promise<Menu> {
  return post<Menu>('/menus', dto);
}

export async function updateMenu(
  id: string,
  dto: UpdateMenuDto,
): Promise<Menu> {
  return patch<Menu>(`/menus/${id}`, dto);
}

export async function deleteMenu(id: string): Promise<void> {
  return del(`/menus/${id}`);
}
