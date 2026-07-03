import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from './payment.entity';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('qr')
  create(@Body() dto: CreatePaymentDto): Promise<Payment> {
    return this.paymentService.create(dto.orderId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Payment> {
    return this.paymentService.findById(id);
  }

  @Get('order/:orderId')
  findByOrder(@Param('orderId') orderId: string): Promise<Payment[]> {
    return this.paymentService.findByOrder(orderId);
  }

  @Post(':id/verify')
  verify(@Param('id') id: string): Promise<Payment> {
    return this.paymentService.verify(id);
  }

  @Post(':id/mark-manual')
  markManual(@Param('id') id: string): Promise<Payment> {
    return this.paymentService.markManual(id);
  }
}
