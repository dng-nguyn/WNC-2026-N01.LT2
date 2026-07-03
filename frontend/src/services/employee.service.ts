import { get, post, patch } from './api';
import type { User, UserRole } from '../types';

export interface CreateUserPayload {
  username: string;
  password: string;
  fullName?: string;
  phone?: string;
  role?: UserRole;
}

export interface UpdateUserPayload {
  fullName?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}

export async function fetchUsers(): Promise<User[]> {
  return get<User[]>('/users');
}

export async function fetchUser(id: string): Promise<User> {
  return get<User>(`/users/${id}`);
}

export async function createUser(dto: CreateUserPayload): Promise<User> {
  return post<User>('/users', dto);
}

export async function updateUser(
  id: string,
  dto: UpdateUserPayload,
): Promise<User> {
  return patch<User>(`/users/${id}`, dto);
}

export async function resetPassword(
  id: string,
  password?: string,
): Promise<{ message: string }> {
  return post<{ message: string }>(`/users/${id}/reset-password`, {
    password,
  });
}
