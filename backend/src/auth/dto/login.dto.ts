import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(3, 50)
  username!: string;

  @IsString()
  @Length(8, 100, { message: 'Password must be between 8 and 100 characters' })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/(?=.*\d)/, { message: 'Password must contain at least one number' })
  password!: string;
}
