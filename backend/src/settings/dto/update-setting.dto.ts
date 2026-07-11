import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateSettingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key!: string;

  @IsString()
  value!: string;
}

export class SepayApiKeyDto {
  @IsString()
  @IsNotEmpty()
  apiKey!: string;
}

export class SepayAccountDto {
  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @IsString()
  bankBin!: string;

  @IsString()
  accountHolder!: string;
}
