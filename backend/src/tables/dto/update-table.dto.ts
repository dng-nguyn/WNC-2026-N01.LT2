import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TableStatus } from '../table-status.enum';

export class UpdateTableDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  tableNumber?: string;

  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;
}
