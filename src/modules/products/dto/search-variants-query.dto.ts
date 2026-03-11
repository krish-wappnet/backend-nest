import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class SearchVariantsQueryDto extends PaginationQueryDto {
  @ApiProperty({
    example: 'black tshirt',
    description:
      'Search query that matches product name, variant SKU, or variant attribute values.',
  })
  @IsString()
  @IsNotEmpty()
  q!: string;
}
