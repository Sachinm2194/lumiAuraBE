import { IsNumber, IsNotEmpty, Min, IsOptional } from 'class-validator';

export class UpdateCartItemDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @IsNumber()
  @IsOptional()
  variantId?: number; // Optional variant ID
}
