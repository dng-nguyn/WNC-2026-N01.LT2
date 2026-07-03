import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Transaction } from './transaction.entity';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { ImmudbService } from './immudb.service';
import { SePayService } from './sepay.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction]), HttpModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, ImmudbService, SePayService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
