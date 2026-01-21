import { IsUUID, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class AddToCartDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}
