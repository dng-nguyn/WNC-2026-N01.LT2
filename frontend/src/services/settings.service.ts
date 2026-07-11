import { get, put, post } from './api';

export interface SepayConfig {
  apiKeySet: boolean;
  apiKeyPreview: string | null;
  accountNumber: string | null;
  bankName: string | null;
  bankBin: string | null;
  accountHolder: string | null;
}

export interface SepayBankAccount {
  id: string;
  account_holder_name: string;
  account_number: string;
  accumulated: string;
  label: string;
  bank_short_name: string;
  bank_full_name: string;
  bank_bin: string;
  bank_code: string;
  active: string;
}

export interface SepayStatus {
  configured: boolean;
  valid: boolean;
  message: string;
}

export async function getSepayConfig(): Promise<SepayConfig> {
  return get<SepayConfig>('/settings/sepay');
}

export async function setSepayApiKey(apiKey: string): Promise<{ success: boolean }> {
  return put<{ success: boolean }>('/settings/sepay/api-key', { apiKey });
}

export async function removeSepayApiKey(): Promise<{ success: boolean }> {
  return post<{ success: boolean }>('/settings/sepay/api-key/remove');
}


export async function listSepayAccounts(): Promise<SepayBankAccount[]> {
  return get<SepayBankAccount[]>('/settings/sepay/accounts');
}

export async function setSepayAccount(account: {
  accountNumber: string;
  bankName: string;
  bankBin: string;
  accountHolder: string;
}): Promise<{ success: boolean }> {
  return put<{ success: boolean }>('/settings/sepay/account', account);
}

export async function getSepayStatus(): Promise<SepayStatus> {
  return get<SepayStatus>('/settings/sepay/status');
}
