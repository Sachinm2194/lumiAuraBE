import { IsUUID, IsNotEmpty } from 'class-validator';

export class RemoveFromWishlistDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;
}

