import { IsNumber, IsNotEmpty, Min, IsOptional, IsUUID } from 'class-validator';

export class UpdateCartItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string; // UUID of product

  @IsNumber()
  @IsNotEmpty()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @IsNumber()
  @IsOptional()
  variantId?: number; // Optional variant ID
}
