import { get, post } from './api';
import type { Transaction } from '../types';

export async function fetchTransactions(limit = 50): Promise<Transaction[]> {
  return get<Transaction[]>(`/transactions?limit=${limit}`);
}

export async function reverifyTransaction(id: string): Promise<Transaction> {
  return post<Transaction>(`/transactions/${id}/reverify`);
}
