import { IsNumber, IsNotEmpty } from 'class-validator';

export class RemoveFromWishlistDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  productId: number;
}

