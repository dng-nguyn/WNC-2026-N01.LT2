import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TableStatus } from '../table-status.enum';

export class CreateTableDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  tableNumber: string;

  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;
}
