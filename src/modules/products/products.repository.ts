import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  create(entity: Partial<Product>): Product {
    return this.repo.create(entity);
  }

  save(entity: Product): Promise<Product> {
    return this.repo.save(entity);
  }

  findById(id: string): Promise<Product | null> {
    return this.repo.findOne({
      where: { id },
      relations: {
        variants: {
          inventory: true,
          attributeValues: { attributeValue: { attribute: true } },
        },
        productAttributes: {
          attribute: true,
          values: { attributeValue: true },
        },
      },
      withDeleted: false,
    });
  }

  findByVendorId(vendorId: string): Promise<Product[]> {
    return this.repo.find({
      where: { vendorId },
      order: { createdAt: 'DESC' },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete({ id });
  }

  async update(
    id: string,
    patch: Partial<Pick<Product, 'name' | 'description' | 'basePrice'>>,
  ): Promise<void> {
    await this.repo.update({ id }, patch);
  }
}
