import { get, post, patch, del } from './api';
import type { Employee, User } from '../types';

// ===== Employee CRUD (via /employees — MANAGER role required) =====

export async function fetchEmployees(): Promise<Employee[]> {
  return get<Employee[]>('/employees');
}

export async function fetchEmployee(id: string): Promise<Employee> {
  return get<Employee>(`/employees/${id}`);
}

export async function createEmployee(data: {
  username?: string;
  password?: string;
  role?: string;
  fullName: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  salary?: number;
}): Promise<Employee> {
  return post<Employee>('/employees', data);
}

export async function updateEmployee(
  id: string,
  data: {
    fullName?: string;
    email?: string;
    phone?: string;
    position?: string;
    department?: string;
    salary?: number;
    isActive?: boolean;
  },
): Promise<Employee> {
  return patch<Employee>(`/employees/${id}`, data);
}

export async function deleteEmployee(id: string): Promise<void> {
  return del<void>(`/employees/${id}`);
}

export async function resetEmployeePassword(
  id: string,
  newPassword?: string,
): Promise<{ message: string; newPassword: string }> {
  return post<{ message: string; newPassword: string }>(
    `/employees/${id}/reset-password`,
    newPassword ? { newPassword } : {},
  );
}

// ===== User account deletion (cleanup for failed employee creation) =====

export async function deleteUserAccount(id: string): Promise<void> {
  return del<void>(`/users/${id}`);
}

export async function updateUserAccount(
  id: string,
  data: { fullName?: string; phone?: string; role?: string; isActive?: boolean },
): Promise<User> {
  return patch<User>(`/users/${id}`, data);
}

export async function resetUserPassword(
  id: string,
  password?: string,
): Promise<{ message: string; newPassword: string }> {
  return post<{ message: string; newPassword: string }>(
    `/users/${id}/reset-password`,
    password ? { password } : {},
  );
}
