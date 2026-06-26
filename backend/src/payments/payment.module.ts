import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Order } from '../orders/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Order])],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
