import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product, ProductStatus } from './product.entity';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  createQueryBuilder(alias: string): SelectQueryBuilder<Product> {
    return this.repo.createQueryBuilder(alias);
  }

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
    patch: Partial<
      Pick<Product, 'name' | 'description' | 'basePrice' | 'featured'>
    >,
  ): Promise<void> {
    await this.repo.update({ id }, patch);
  }

  async updateStatus(id: string, status: ProductStatus): Promise<void> {
    await this.repo.update({ id }, { status });
  }

  async countFeatured(): Promise<number> {
    return this.repo.count({
      where: { featured: true },
    });
  }

  async findLowestPricedActive(): Promise<Product | null> {
    return this.repo
      .createQueryBuilder('product')
      .where('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('product.deletedAt IS NULL')
      .orderBy('product.basePrice', 'ASC')
      .addOrderBy('product.createdAt', 'DESC')
      .getOne();
  }
}
