import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ImmudbTransactionData {
  transactionId: string;
  orderId: string;
  amount: number;
  verificationType: string;
  sepayTransactionId?: string;
  verifiedAt: string;
}

@Injectable()
export class ImmudbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ImmudbService.name);
  private client: any = null;
  private connected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('IMMUDB_HOST');
    const port = this.configService.get<number>('IMMUDB_PORT', 3322);
    const user = this.configService.get<string>('IMMUDB_USER', 'immudb');
    const password = this.configService.get<string>('IMMUDB_PASSWORD', 'immudb');
    const database = this.configService.get<string>('IMMUDB_DATABASE', 'defaultdb');

    if (!host) {
      this.logger.warn('IMMUDB_HOST not set — immudb logging disabled');
      return;
    }

    try {
      const ImmudbClient = require('immudb-node').default;
      this.client = new ImmudbClient({ address: `${host}:${port}` });
      await this.client.login({ user, password });
      await this.client.useDatabase({ databasename: database });
      this.connected = true;
      this.logger.log(`Connected to immudb at ${host}:${port}/${database}`);
    } catch (err: unknown) {
      this.logger.warn(`Immudb connection failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  async onModuleDestroy() {
    this.client = null;
    this.connected = false;
  }

  get isConnected(): boolean {
    return this.connected;
  }

  async logTransaction(data: ImmudbTransactionData): Promise<number | null> {
    if (!this.connected || !this.client) return null;

    try {
      const value = JSON.stringify(data);
      const res = await this.client.set({ key: `txn:${data.transactionId}`, value });
      await this.client.set({ key: `order:${data.orderId}:${data.transactionId}`, value });
      return res.id;
    } catch (err: unknown) {
      this.logger.warn(`Immudb set failed: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  async getTransaction(transactionId: string): Promise<ImmudbTransactionData | null> {
    if (!this.connected || !this.client) return null;

    try {
      const res = await this.client.get({ key: `txn:${transactionId}` });
      if (res?.value) return JSON.parse(res.value.toString());
      return null;
    } catch {
      return null;
    }
  }

  async scanTransactions(limit = 2500): Promise<ImmudbTransactionData[]> {
    if (!this.connected || !this.client) return [];

    try {
      const safeLimit = Math.min(limit, 2500);
      const res = await this.client.scan({ prefix: 'txn:', limit: safeLimit });
      return (res.entriesList ?? [])
        .map((entry: any) => {
          try { return JSON.parse(entry.value.toString()); } catch { return null; }
        })
        .filter(Boolean);
    } catch (err: unknown) {
      this.logger.warn(`Immudb scan failed: ${err instanceof Error ? err.message : err}`);
      return [];
    }
  }

  async findByOrderId(orderId: string): Promise<ImmudbTransactionData[]> {
    if (!this.connected || !this.client) return [];

    try {
      const res = await this.client.scan({ prefix: `order:${orderId}:`, limit: 100 });
      return (res.entriesList ?? [])
        .map((entry: any) => {
          try { return JSON.parse(entry.value.toString()); } catch { return null; }
        })
        .filter(Boolean);
    } catch (err: unknown) {
      this.logger.warn(`Immudb order scan failed: ${err instanceof Error ? err.message : err}`);
      return [];
    }
  }
}
