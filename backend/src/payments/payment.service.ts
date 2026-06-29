import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'node:crypto';
import { firstValueFrom } from 'rxjs';
import { Payment } from './payment.entity';
import { PaymentStatus } from './payment-status.enum';
import { Order } from '../orders/order.entity';
import { OrderStatus } from '../orders/order-status.enum';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  // ── QR Code Generation (public VietQR — no Sepay token needed) ──

  async create(orderId: string): Promise<Payment> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { items: true },
    });
    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Cannot create payment for a cancelled order');
    }

    const code = this.generateCode(12);
    const amountVnd = Math.round(Number(order.totalAmount));

    const accountNumber = this.configService.get<string>('SEPAY_ACCOUNT_NUMBER') || '3669420000';
    const bankName = this.configService.get<string>('SEPAY_BANK_NAME') || 'MBBank';

    const qrUrl =
      `https://vietqr.app/img` +
      `?acc=${encodeURIComponent(accountNumber)}` +
      `&bank=${encodeURIComponent(bankName)}` +
      `&amount=${amountVnd}` +
      `&des=${encodeURIComponent(code)}` +
      `&template=compact` +
      `&showinfo=true`;

    const payment = this.paymentRepository.create({
      order,
      code,
      amount: amountVnd,
      status: PaymentStatus.PENDING,
      qrUrl,
    });

    return this.paymentRepository.save(payment);
  }

  // ── Payment Lookup ──

  async findById(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: { order: true },
    });
    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }
    return payment;
  }

  async findByOrder(orderId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { order: { id: orderId } },
      relations: { order: true },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Verification via Sepay API ──

  async verify(paymentId: string): Promise<Payment> {
    const payment = await this.findById(paymentId);

    // Already completed — return as-is
    if (payment.status === PaymentStatus.COMPLETED) {
      return payment;
    }

    // Mark failed/expired payments — no point checking Sepay
    if (payment.status === PaymentStatus.FAILED || payment.status === PaymentStatus.EXPIRED) {
      return payment;
    }

    const apiKey = this.configService.get<string>('SEPAY_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('SEPAY_API_KEY not configured');
    }

    // Query Sepay for matching transaction
    const tx = await this.findSepayTransaction(apiKey, payment.code, payment.amount);

    // No transaction found yet — payment is still pending, return OK
    if (!tx) {
      const pendingPayment = await this.paymentRepository.findOne({
        where: { id: paymentId },
        relations: { order: true },
      });
      return pendingPayment!;
    }

    // Transaction found — mark as completed
    payment.status = PaymentStatus.COMPLETED;
    payment.sepayTransactionId = tx.id;
    await this.paymentRepository.save(payment);

    // Update order status to reflect payment completion
    const order = await this.orderRepository.findOne({
      where: { id: payment.order.id },
    });
    if (order) {
      order.status = OrderStatus.COMPLETED;
      await this.orderRepository.save(order);
    }

    const updatedPayment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: { order: true },
    });
    if (!updatedPayment) {
      throw new NotFoundException(`Payment with id ${paymentId} not found after verification`);
    }
    return updatedPayment;
  }

  // ── Sepay API Helpers ──

  private async findSepayTransaction(
    apiKey: string,
    code: string,
    amount: number,
  ): Promise<{ id: string } | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{
          transactions: Array<{
            id: string;
            amount_in: number;
            transaction_content: string;
            transfer_type: string;
          }>;
        }>('https://userapi.sepay.vn/v2/transactions', {
          params: {
            transaction_content: code,
            transfer_type: 'in',
            per_page: 10,
            timestamp_format: 'iso8601',
          },
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/json',
          },
          timeout: 10000,
        }),
      );

      const txs = response.data;
      if (!txs?.transactions?.length) return null;

      const match = txs.transactions.find(
        (tx) => tx.amount_in === amount && tx.transfer_type === 'in',
      );

      return match ? { id: match.id } : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown';
      throw new BadRequestException(`Sepay API error: ${message}`);
    }
  }

  // ── Utilities ──

  private generateCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[crypto.randomInt(chars.length)];
    }
    return result;
  }
}
