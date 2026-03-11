import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory, ProductStatus } from '../product.entity';

export class CreateProductDto {
  @ApiProperty({
    example: 'Slim Fit Cotton T‑Shirt',
    description: 'Human readable product name shown to customers.',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example:
      '100% cotton slim fit t‑shirt available in multiple colors and sizes.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: ProductCategory.MENS,
    enum: ProductCategory,
    required: false,
    description:
      'Top-level clothing category for the product. Allowed values: MENS, WOMENS, KIDS.',
  })
  @IsEnum(ProductCategory)
  @IsOptional()
  category?: ProductCategory;

  @ApiProperty({
    example: 'H&M',
    required: false,
    description: 'Optional brand name of the product.',
  })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiProperty({
    example: 1299,
    description:
      'Base price in the smallest currency unit (for example, cents).',
  })
  @Transform(({ value }) => {
    const v: unknown = value;
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const n = Number(value);
      return Number.isFinite(n) ? n : v;
    }
    return v;
  })
  @IsNumber()
  basePrice!: number;

  @ApiProperty({
    example: ProductStatus.DRAFT,
    enum: ProductStatus,
    required: false,
    description:
      'Product status. Allowed values: 1 (DRAFT), 2 (ACTIVE), 3 (ARCHIVED).',
  })
  @Transform(({ value }) => {
    const v: unknown = value;
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const n = Number(value);
      return Number.isFinite(n) ? n : v;
    }
    return v;
  })
  @IsInt()
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiProperty({
    example: {
      color: ['black', 'white', 'navy'],
      size: ['S', 'M', 'L', 'XL'],
    },
    description:
      'Map of attribute keys to list of possible values used to generate variants.',
  })
  @Transform(({ value }) => {
    const v: unknown = value;
    if (typeof value === 'string') {
      try {
        const parsed: unknown = JSON.parse(value);
        return parsed;
      } catch {
        return v;
      }
    }
    return v;
  })
  @IsObject()
  attributes!: Record<string, string[]>;

  @ApiProperty({
    example: 150,
    required: false,
    description: 'Initial on-hand stock quantity for the default variant.',
  })
  @Transform(({ value }) => {
    const v: unknown = value;
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const n = Number(value);
      return Number.isFinite(n) ? n : v;
    }
    return v;
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  defaultStock?: number;

  @ApiProperty({
    example: 'RACK-A3-SHELF-02',
    required: false,
    description: 'Optional code or label for where the item is stored.',
  })
  @IsString()
  @IsOptional()
  warehouseLocation?: string;
}
