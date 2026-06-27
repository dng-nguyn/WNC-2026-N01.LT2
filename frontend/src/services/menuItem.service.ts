import apiClient from './api';
import { MenuItem } from '../types';

export const getMenuItems = async (menuId?: string): Promise<MenuItem[]> => {
  const params = menuId ? { menuId } : {};
  const response = await apiClient.get('/menu-items', { params });
  return response.data;
};

export const getMenuItem = async (id: string): Promise<MenuItem> => {
  const response = await apiClient.get(`/menu-items/${id}`);
  return response.data;
};

export const createMenuItem = async (data: {
  name: string;
  price: number;
  menuId: string;
  description?: string;
  imageUrl?: string;
}): Promise<MenuItem> => {
  const response = await apiClient.post('/menu-items', data);
  return response.data;
};

export const updateMenuItem = async (
  id: string,
  data: Partial<{ name: string; price: number; menuId: string; description: string; imageUrl: string }>
): Promise<MenuItem> => {
  const response = await apiClient.put(`/menu-items/${id}`, data);
  return response.data;
};

export const deleteMenuItem = async (id: string): Promise<void> => {
  await apiClient.delete(`/menu-items/${id}`);
};
