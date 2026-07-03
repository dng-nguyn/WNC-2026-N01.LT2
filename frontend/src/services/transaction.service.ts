import { get, post } from './api';
import type { Transaction } from '../types';

export async function fetchTransactions(limit = 50, dateFrom?: string, dateTo?: string): Promise<Transaction[]> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);
  return get<Transaction[]>(`/transactions?${params.toString()}`);
}

export async function reverifyTransaction(id: string): Promise<Transaction> {
  return post<Transaction>(`/transactions/${id}/reverify`);
}
