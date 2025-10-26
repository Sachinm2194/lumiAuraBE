import { IsNumber, IsNotEmpty } from 'class-validator';

export class ClearCartDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
