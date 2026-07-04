import { Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction } from './transaction.entity';
import { SePayService } from './sepay.service';

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly sePayService: SePayService,
  ) {}

  @Get()
  findAll(
    @Query('limit') limit?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<Transaction[]> {
    const n = limit ? parseInt(limit, 10) : 50;
    return this.transactionsService.findAll(n, dateFrom, dateTo);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Transaction> {
    return this.transactionsService.findById(id);
  }

  @Post(':id/reverify')
  async reverify(@Param('id') id: string): Promise<Transaction> {
    const tx = await this.transactionsService.findById(id);

    // Try to match by payment code first, fall back to amount
    let sepayMatch: { id: string } | null = null;
    if (tx.payment?.code) {
      sepayMatch = await this.sePayService.findTransactionByCode(tx.payment.code, Number(tx.amount));
    }
    if (!sepayMatch) {
      sepayMatch = await this.sePayService.findTransactionForAmount(Number(tx.amount));
    }

    if (!sepayMatch) {
      throw new NotFoundException(
        `No matching SePay transaction found for transaction ${id}`,
      );
    }

    return this.transactionsService.updateReverified(id, sepayMatch.id);
  }
}
