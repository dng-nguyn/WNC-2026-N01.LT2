import { IsEnum, IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../order-status.enum';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  customerName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  itemName!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumberString()
  totalPrice!: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}