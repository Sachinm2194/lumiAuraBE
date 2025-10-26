import { IsNumber, IsNotEmpty, Min, IsOptional } from 'class-validator';

export class UpdateCartItemDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1, { message: 'Quantity must be at least 1' })
  @IsOptional()
  quantity?: number;
}
