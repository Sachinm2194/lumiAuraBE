import { IsEmail, IsString, MinLength, IsOptional, Matches, IsIn } from 'class-validator';

export class CreateUserDTO {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/, { message: 'Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character' })
  password?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsIn(['email', 'google'])
  @IsOptional()
  authProvider?: string;

  @IsOptional()
  isVerified?: boolean;

  @IsString()
  @IsOptional()
  verificationToken?: string;

  @IsOptional()
  verificationTokenExpiry?: Date;
}
