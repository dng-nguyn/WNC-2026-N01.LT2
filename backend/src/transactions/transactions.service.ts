import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { VerificationType } from './verification-type.enum';
import { ImmudbService, ImmudbTransactionData } from './immudb.service';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly immudbService: ImmudbService,
  ) {}

  async logTransaction(params: {
    orderId: string;
    paymentId?: string;
    paymentCode?: string;
    amount: number;
    verificationType: VerificationType;
    sepayTransactionId?: string;
  }): Promise<Transaction> {
    const now = new Date();

    // Write to MySQL first to get the ID
    let saved: Transaction;
    try {
      const transaction = this.transactionRepository.create({
        order: { id: params.orderId },
        payment: params.paymentId ? { id: params.paymentId } : null,
        amount: params.amount,
        verificationType: params.verificationType,
        verifiedAt: now,
        sepayTransactionId: params.sepayTransactionId ?? null,
      });
      saved = await this.transactionRepository.save(transaction);
    } catch (err: unknown) {
      this.logger.warn(`MySQL write failed: ${err instanceof Error ? err.message : err}`);
      return this.immudbDataToTransaction({
        transactionId: '',
        orderId: params.orderId,
        paymentCode: params.paymentCode,
        amount: params.amount,
        verificationType: params.verificationType,
        sepayTransactionId: params.sepayTransactionId,
        verifiedAt: now.toISOString(),
      });
    }

    // Log to immudb with the MySQL ID as key (non-blocking)
    try {
      const txId = await this.immudbService.logTransaction({
        transactionId: saved.id,
        orderId: params.orderId,
        paymentCode: params.paymentCode,
        amount: params.amount,
        verificationType: params.verificationType,
        sepayTransactionId: params.sepayTransactionId,
        verifiedAt: now.toISOString(),
      });
      if (txId != null) {
        saved.immudbTxId = String(txId);
        await this.transactionRepository.save(saved);
      }
    } catch (err: unknown) {
      this.logger.warn(`Immudb logging failed: ${err instanceof Error ? err.message : err}`);
    }

    return saved;
  }

  async findAll(limit = 50, dateFrom?: string, dateTo?: string): Promise<Transaction[]> {
    // PRIMARY: Read from MySQL (has proper order/payment relations)
    const where: Record<string, unknown> = {};
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : new Date('2000-01-01');
      const to = dateTo ? new Date(dateTo + 'T23:59:59') : new Date();
      where.verifiedAt = Between(from, to);
    }

    try {
      const results = await this.transactionRepository.find({
        where,
        relations: { order: true, payment: true },
        order: { createdAt: 'DESC' },
        take: limit,
      });
      if (results.length > 0) {
        return results;
      }
    } catch (err: unknown) {
      this.logger.warn(`MySQL query failed: ${err instanceof Error ? err.message : err}`);
    }

    // FALLBACK: Read from immudb (no relations, but survives MySQL loss)
    if (this.immudbService.isConnected) {
      this.logger.log('MySQL empty — falling back to immudb');
      return this.findAllFromImmudb(limit, dateFrom, dateTo);
    }

    return [];
  }

  async findAllFromImmudb(limit = 50, dateFrom?: string, dateTo?: string): Promise<Transaction[]> {
    const immudbData = await this.immudbService.scanTransactions(limit);

    let filtered = immudbData;
    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : new Date('2000-01-01');
      const to = dateTo ? new Date(dateTo + 'T23:59:59') : new Date();
      filtered = immudbData.filter((d) => {
        const t = new Date(d.verifiedAt);
        return t >= from && t <= to;
      });
    }

    // Merge MySQL reverify data (reverifiedAt, sepayTransactionId updates)
    let mysqlMap = new Map<string, Transaction>();
    try {
      const ids = filtered.map((d) => d.transactionId).filter(Boolean);
      if (ids.length > 0) {
        const mysqlRows = await this.transactionRepository.findBy({ id: In(ids) });
        mysqlMap = new Map(mysqlRows.map((r) => [r.id, r]));
      }
    } catch {
      // MySQL unavailable — immudb-only is fine
    }

    return filtered
      .sort((a, b) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime())
      .slice(0, limit)
      .map((d) => {
        const tx = this.immudbDataToTransaction(d);
        const mysql = mysqlMap.get(d.transactionId);
        if (mysql) {
          tx.reverifiedAt = mysql.reverifiedAt;
          if (mysql.sepayTransactionId) tx.sepayTransactionId = mysql.sepayTransactionId;
          if (mysql.payment) tx.payment = mysql.payment;
        }
        return tx;
      });
  }

  async findById(id: string): Promise<Transaction> {
    // PRIMARY: Look up in MySQL (has proper relations)
    const tx = await this.transactionRepository.findOne({
      where: { id },
      relations: { order: true, payment: true },
    });
    if (tx) return tx;

    // FALLBACK: Direct key lookup in immudb
    if (this.immudbService.isConnected) {
      const match = await this.immudbService.getTransaction(id);
      if (match) {
        return this.immudbDataToTransaction(match);
      }
    }

    throw new Error(`Transaction ${id} not found`);
  }

  async updateReverified(id: string, sepayTransactionId: string): Promise<Transaction> {
    const tx = await this.findById(id);
    tx.reverifiedAt = new Date();
    tx.sepayTransactionId = sepayTransactionId;

    // Update in MySQL if it exists there
    try {
      const existing = await this.transactionRepository.findOne({
        where: { id },
        relations: { order: true, payment: true },
      });
      if (existing) {
        existing.reverifiedAt = tx.reverifiedAt;
        existing.sepayTransactionId = tx.sepayTransactionId;
        return await this.transactionRepository.save(existing);
      }
    } catch {
      // MySQL unavailable — immudb-only is fine
    }

    return tx;
  }

  private immudbDataToTransaction(d: ImmudbTransactionData): Transaction {
    const tx = new Transaction();
    tx.id = d.transactionId;
    tx.order = d.orderId ? ({ id: d.orderId } as any) : null as any;
    tx.payment = d.paymentCode ? ({ code: d.paymentCode } as any) : null;
    tx.amount = d.amount;
    tx.verificationType = d.verificationType as VerificationType;
    tx.verifiedAt = new Date(d.verifiedAt);
    tx.reverifiedAt = null;
    tx.sepayTransactionId = d.sepayTransactionId ?? null;
    tx.immudbTxId = null;
    tx.createdAt = new Date(d.verifiedAt);
    tx.updatedAt = new Date(d.verifiedAt);
    return tx;
  }
}
