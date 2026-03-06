import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attribute } from './attribute.entity';

@Injectable()
export class AttributesRepository {
  constructor(
    @InjectRepository(Attribute)
    private readonly repo: Repository<Attribute>,
  ) {}

  findByName(name: string): Promise<Attribute | null> {
    return this.repo.findOne({ where: { name } });
  }
}
