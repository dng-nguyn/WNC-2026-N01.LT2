import { get, post, patch, del } from './api';
import type { Table, CreateTableDto, UpdateTableDto } from '../types';

export async function fetchTables(): Promise<Table[]> {
  return get<Table[]>('/tables');
}

export async function fetchTable(id: string): Promise<Table> {
  return get<Table>(`/tables/${id}`);
}

export async function createTable(dto: CreateTableDto): Promise<Table> {
  return post<Table>('/tables', dto);
}

export async function updateTable(
  id: string,
  dto: UpdateTableDto,
): Promise<Table> {
  return patch<Table>(`/tables/${id}`, dto);
}

export async function deleteTable(id: string): Promise<void> {
  return del(`/tables/${id}`);
}
