import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiProperty({
    example: 'Slim Fit Cotton T‑Shirt (New Season)',
    required: false,
    description: 'New product name (if changing).',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'Updated description with new colorways and improved fabric.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 1399,
    required: false,
    description:
      'Updated base price in the smallest currency unit (for example, cents).',
  })
  @IsNumber()
  @IsOptional()
  basePrice?: number;
}
