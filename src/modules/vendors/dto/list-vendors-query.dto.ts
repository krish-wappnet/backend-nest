import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VendorStatus } from '../../users/vendor-status.enum';

export class ListVendorsQueryDto {
  @ApiPropertyOptional({
    example: 'tech',
    description: 'Search vendors by store name (case-insensitive).',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: VendorStatus.APPROVED,
    enum: VendorStatus,
    description: 'Filter vendors by status.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(VendorStatus)
  status?: VendorStatus;
}
