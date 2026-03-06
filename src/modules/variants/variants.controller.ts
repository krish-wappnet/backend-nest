import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Variants')
@Controller('variants')
export class VariantsController {}
