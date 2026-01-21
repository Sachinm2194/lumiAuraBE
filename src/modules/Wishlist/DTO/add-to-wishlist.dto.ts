import { IsUUID, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddToWishlistDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

