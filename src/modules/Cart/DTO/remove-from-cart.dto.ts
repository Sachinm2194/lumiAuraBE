import { IsArray, IsUUID, IsNotEmpty } from 'class-validator';

export class RemoveFromCartDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  productIds: string[]; // Array of product UUIDs
}
