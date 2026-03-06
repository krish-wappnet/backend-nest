import { Injectable } from '@nestjs/common';
import { AttributesRepository } from './attributes.repository';

@Injectable()
export class AttributesService {
  constructor(private readonly attributesRepository: AttributesRepository) {}
}
