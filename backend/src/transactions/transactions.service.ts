import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { VerificationType } from './verification-type.enum';
import { ImmudbService } from './immudb.service';

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
    amount: number;
    verificationType: VerificationType;
    sepayTransactionId?: string;
  }): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      order: { id: params.orderId },
      payment: params.paymentId ? { id: params.paymentId } : null,
      amount: params.amount,
      verificationType: params.verificationType,
      verifiedAt: new Date(),
      sepayTransactionId: params.sepayTransactionId ?? null,
    });

    const saved = await this.transactionRepository.save(transaction);

    // Log to immudb (optional — non-blocking)
    try {
      const txId = await this.immudbService.logTransaction({
        transactionId: saved.id,
        orderId: params.orderId,
        amount: params.amount,
        verificationType: params.verificationType,
        sepayTransactionId: params.sepayTransactionId,
        verifiedAt: saved.verifiedAt.toISOString(),
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
    const where: Record<string, unknown> = {};

    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : new Date('2000-01-01');
      const to = dateTo ? new Date(dateTo + 'T23:59:59') : new Date();
      where.verifiedAt = Between(from, to);
    }

    return this.transactionRepository.find({
      where,
      relations: { order: true, payment: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findById(id: string): Promise<Transaction> {
    const tx = await this.transactionRepository.findOne({
      where: { id },
      relations: { order: true, payment: true },
    });
    if (!tx) {
      throw new Error(`Transaction ${id} not found`);
    }
    return tx;
  }

  async updateReverified(id: string, sepayTransactionId: string | null): Promise<Transaction> {
    const tx = await this.findById(id);
    tx.reverifiedAt = new Date();
    if (sepayTransactionId) {
      tx.sepayTransactionId = sepayTransactionId;
    }
    return this.transactionRepository.save(tx);
  }
}
