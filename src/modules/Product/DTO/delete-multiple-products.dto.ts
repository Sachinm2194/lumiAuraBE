import { IsArray, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class DeleteMultipleProductsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) =>
    Array.isArray(value) ? value : []
  )
  productIds: string[];
}
