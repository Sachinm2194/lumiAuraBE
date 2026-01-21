import { IsNumber, IsNotEmpty } from 'class-validator';

export class RemoveFromWishlistDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;
}

