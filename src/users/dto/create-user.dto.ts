import { IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(3, 100)
  username!: string;

  @IsString()
  @Length(6, 100)
  password!: string;
}
