import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVariantDto {
  @ApiProperty({
    example: 'TSHIRT-SLIM-WHT-M',
    description:
      'SKU code for this clothing variant (usually encoding style, color and size).',
  })
  @IsString()
  sku!: string;

  @ApiProperty({
    example: 1299,
    description:
      'Variant price in the smallest currency unit (for example, cents).',
  })
  @IsNumber()
  price!: number;

  @ApiProperty({
    example: 'active',
    required: false,
    description: 'Optional status label for the variant (e.g., active).',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
