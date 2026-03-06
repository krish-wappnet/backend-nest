import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyVendorDto {
  @ApiProperty({
    example: 'Krish Tech Store',
    description: 'Display name of the vendor store.',
  })
  @IsString()
  @IsNotEmpty()
  storeName!: string;

  @ApiProperty({
    example: 'krish-tech-store',
    description: 'URL-friendly slug that will identify the store.',
  })
  @IsString()
  @IsNotEmpty()
  storeSlug!: string;

  @ApiProperty({
    example: 'billing@krishtech.example',
    description: 'Business contact email for the vendor.',
  })
  @IsEmail()
  businessEmail!: string;

  @ApiProperty({
    example: '+91-9876543210',
    description: 'Primary contact phone number of the vendor.',
  })
  @IsString()
  @IsNotEmpty()
  phone!: string;
}
