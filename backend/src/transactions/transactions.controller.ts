import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction } from './transaction.entity';
import { SePayService } from './sepay.service';

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly sepayService: SePayService,
  ) {}

  @Get()
  findAll(@Query('limit') limit?: string): Promise<Transaction[]> {
    const n = limit ? parseInt(limit, 10) : 50;
    return this.transactionsService.findAll(n);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Transaction> {
    return this.transactionsService.findById(id);
  }

  @Post(':id/reverify')
  async reverify(@Param('id') id: string): Promise<Transaction> {
    const tx = await this.transactionsService.findById(id);
    const sepayMatch = await this.sepayService.findTransactionForAmount(tx.amount);
    return this.transactionsService.updateReverified(id, sepayMatch?.id ?? null);
  }
}
