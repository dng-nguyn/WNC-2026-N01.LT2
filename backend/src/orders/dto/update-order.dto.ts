import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { OrderStatus } from '../order-status.enum';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsUUID()
  tableId?: string;
}
