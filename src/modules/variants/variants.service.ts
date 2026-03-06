import { Injectable } from '@nestjs/common';
import { VariantsRepository } from './variants.repository';

@Injectable()
export class VariantsService {
  constructor(private readonly variantsRepository: VariantsRepository) {}
}
