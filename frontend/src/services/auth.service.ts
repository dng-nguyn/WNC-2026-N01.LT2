import apiClient from './api';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../types';

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
};

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

export const getProfile = async (): Promise<User> => {
  const response = await apiClient.get('/auth/profile');
  return response.data;
};
