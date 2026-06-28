import { IsOptional, IsNumber, Min, MaxLength, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateOrderItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}