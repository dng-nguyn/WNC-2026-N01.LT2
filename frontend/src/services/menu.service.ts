import apiClient from './api';
import { Menu } from '../types';

export const getMenus = async (): Promise<Menu[]> => {
  const response = await apiClient.get('/menus');
  return response.data;
};

export const getMenu = async (id: string): Promise<Menu> => {
  const response = await apiClient.get(`/menus/${id}`);
  return response.data;
};

export const createMenu = async (data: { name: string; description?: string }): Promise<Menu> => {
  const response = await apiClient.post('/menus', data);
  return response.data;
};

export const updateMenu = async (id: string, data: { name?: string; description?: string }): Promise<Menu> => {
  const response = await apiClient.put(`/menus/${id}`, data);
  return response.data;
};

export const deleteMenu = async (id: string): Promise<void> => {
  await apiClient.delete(`/menus/${id}`);
};
