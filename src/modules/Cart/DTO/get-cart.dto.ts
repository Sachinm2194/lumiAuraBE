import { IsNumber, IsNotEmpty } from 'class-validator';

export class GetCartDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
