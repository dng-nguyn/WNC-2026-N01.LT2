import { IsOptional, IsString, Length } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(3, 50)
  username!: string;

  @IsString()
  @Length(6, 100)
  password!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 15)
  phone?: string;
}
