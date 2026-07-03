import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
      const ImmudbClient = require('immudb-node');
      this.client = ImmudbClient({ address: `${host}:${port}` });

      await this.client.login({ user, password });
      await this.client.useDatabase({ database });
      this.connected = true;
      this.logger.log(`Connected to immudb at ${host}:${port}/${database}`);
    } catch (err: unknown) {
      this.logger.warn(`Immudb connection failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  async onModuleDestroy() {
    // immudb-node client doesn't have an explicit close method
    this.client = null;
    this.connected = false;
  }

  async logTransaction(data: {
    transactionId: string;
    orderId: string;
    amount: number;
    verificationType: string;
    sepayTransactionId?: string;
    verifiedAt: string;
  }): Promise<number | null> {
    if (!this.connected || !this.client) {
      this.logger.debug('Immudb not connected — skipping log');
      return null;
    }

    try {
      const key = `txn:${data.transactionId}`;
      const value = JSON.stringify(data);
      const res = await this.client.set({ key, value });
      this.logger.debug(`Immudb logged: ${key} -> index ${res.index}`);
      return res.index;
    } catch (err: unknown) {
      this.logger.warn(`Immudb set failed: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  async verifyTransaction(transactionId: string): Promise<string | null> {
    if (!this.connected || !this.client) {
      return null;
    }

    try {
      const key = `txn:${transactionId}`;
      const res = await this.client.get({ key });
      return res.value ?? null;
    } catch {
      return null;
    }
  }
}
