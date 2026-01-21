import { IsNumber, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddToWishlistDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

