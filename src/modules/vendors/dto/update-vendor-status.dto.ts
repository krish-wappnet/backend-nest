import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VendorStatus } from '../../users/vendor-status.enum';

export class UpdateVendorStatusDto {
  @ApiProperty({
    example: VendorStatus.APPROVED,
    enum: VendorStatus,
    description: 'New status to set for the vendor.',
  })
  @IsEnum(VendorStatus)
  status!: VendorStatus;
}
