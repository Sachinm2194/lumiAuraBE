// src/modules/Order/dto/create-order.dto.ts
import { IsNotEmpty, IsArray, ValidateNested, IsOptional, IsString, IsNumber, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsNumber()
  variantId?: number; // Add variantId - if not provided, will use default variant

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  productVariant?: {
    size?: string;
    color?: string;
    [key: string]: any;
  };
}

// ... rest of the DTO remains the same ...
export class ShippingAddressDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  postalCode: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsString()
  phone: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  billingAddress?: ShippingAddressDto;

  @IsOptional()
  @IsString()
  notes?: string;
}