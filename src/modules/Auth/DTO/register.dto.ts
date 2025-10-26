// src/modules/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength, Matches, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
    { 
      message: 'Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character' 
    }
  )
  password: string;

  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'Phone must be a string' })
  @IsOptional()
  phone?: string;
}
