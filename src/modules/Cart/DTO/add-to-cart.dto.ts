import { IsUUID, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class AddToCartDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity? : number = 1;

  @IsNumber()
  @IsOptional()
  variantId?: number; // Optional - if not provided, uses default variant
}
