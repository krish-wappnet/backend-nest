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

  @ApiProperty({
    example: '123 Main Street, Tech City, TC 12345',
    description: 'Complete physical address of the vendor store.',
  })
  storeAddress!: string;

  @ApiProperty({
    example: 28.6139,
    description: 'Latitude of the vendor store location.',
  })
  latitude!: number;

  @ApiProperty({
    example: 77.209,
    description: 'Longitude of the vendor store location.',
  })
  longitude!: number;
}
