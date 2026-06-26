import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @IsOptional()
  @IsUUID()
  tableId?: string;

  @IsUUID()
  userId: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
