import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Attributes')
@Controller('attributes')
export class AttributesController {}
