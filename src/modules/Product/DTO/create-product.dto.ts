// src/modules/Product/DTO/create-product.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateProductVariantDto {
  @IsString()
  @IsOptional()
  sku?: string; // Optional - auto-generated from product name + variant name if not provided

  @IsString()
  @IsNotEmpty()
  variantName: string; // e.g., "30ml", "50ml"

  @IsNumber()
  @IsNotEmpty()
  mrp: number;

  @IsNumber()
  @IsNotEmpty()
  sellingPrice: number;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string; // Optional - auto-generated from name if not provided

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return Array.isArray(value) ? value : [];
  })
  ingredients?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return Array.isArray(value) ? value : [];
  })
  benefits?: string[];

  @IsOptional()
  @IsString()
  howToUse?: string;

  @IsOptional()
  @IsString()
  warnings?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return Array.isArray(value) ? value : [];
  })
  skinType?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return Array.isArray(value) ? value : [];
  })
  concerns?: string[];

  @IsOptional()
  @IsString()
  suitableFor?: string;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  isNew?: boolean;

  @IsString()
  @IsOptional()
  status?: 'draft' | 'active' | 'archived';

  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  // Variants - at least one required
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return Array.isArray(value) ? value : [];
  })
  variants: CreateProductVariantDto[];

  // Tags - optional array of tag IDs
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map((id) => Number(id)) : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value.map((id) => Number(id)) : [];
  })
  tagIds?: number[];

  // Images will be handled via file upload
}