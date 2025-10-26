import { IsArray, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class DeleteMultipleProductsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @Transform(({ value }) =>
    
    Array.isArray(value) ? value.map((id) => Number(id)) : []
  )
  ids: number[];
}
