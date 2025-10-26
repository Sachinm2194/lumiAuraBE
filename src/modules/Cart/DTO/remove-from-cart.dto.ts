import { IsNumber, IsNotEmpty } from 'class-validator';

export class RemoveFromCartDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  productId: number;
}
