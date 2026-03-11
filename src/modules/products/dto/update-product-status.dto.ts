import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt } from 'class-validator';
import { ProductStatus } from '../product.entity';

export class UpdateProductStatusDto {
  @ApiProperty({
    example: ProductStatus.ACTIVE,
    enum: ProductStatus,
    description:
      'Product status. Allowed values: 1 (DRAFT), 2 (ACTIVE), 3 (ARCHIVED).',
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
  @IsInt()
  @IsEnum(ProductStatus)
  status!: ProductStatus;
}
