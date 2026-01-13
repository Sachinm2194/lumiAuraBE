// src/modules/auth/dto/auth-response.dto.ts
import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  phone: string;

  @Expose()
  role: string;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  password?: string;
}

export class LoginResponseDto {
  @Expose()
  message: string;

  @Expose()
  access_token: string;

  @Expose()
  user: UserResponseDto;
}

export class RegisterResponseDto {
  @Expose()
  message: string;

  @Expose()
  user: UserResponseDto;
}
