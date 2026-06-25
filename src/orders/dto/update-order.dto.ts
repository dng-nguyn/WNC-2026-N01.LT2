import { IsEnum, IsInt, IsOptional, IsNumberString, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../order-status.enum';

export class UpdateOrderDto {
	@IsOptional()
	@IsString()
	@MaxLength(150)
	customerName?: string;

	@IsOptional()
	@IsString()
	@MaxLength(150)
	itemName?: string;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	quantity?: number;

	@IsOptional()
	@IsNumberString()
	totalPrice?: string;

	@IsOptional()
	@IsEnum(OrderStatus)
	status?: OrderStatus;
}