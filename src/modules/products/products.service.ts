import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { VendorsService } from '../vendors/vendors.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';
import { ProductsRepository } from './products.repository';
import { cartesianProduct } from './utils/cartesian';
import { generateSku } from './utils/sku';
import { Attribute } from '../attributes/attribute.entity';
import { AttributeValue } from '../attributes/attribute-value.entity';
import { ProductAttribute } from './product-attribute.entity';
import { ProductAttributeValue } from './product-attribute-value.entity';
import { ProductVariant } from '../variants/product-variant.entity';
import { VariantAttributeValue } from '../variants/variant-attribute-value.entity';
import { Inventory } from '../inventory/inventory.entity';

@Injectable()
export class ProductsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly vendorsService: VendorsService,
    private readonly productsRepository: ProductsRepository,
  ) {}

  async createProduct(params: {
    userId: string;
    dto: CreateProductDto;
  }): Promise<Product> {
    const vendor = await this.vendorsService.getByUserIdOrThrow(params.userId);

    const attributeEntries = Object.entries(params.dto.attributes ?? {});
    if (attributeEntries.length === 0) {
      throw new BadRequestException('At least one attribute is required');
    }

    for (const [name, values] of attributeEntries) {
      if (!name || name.trim().length === 0) {
        throw new BadRequestException('Attribute name is required');
      }
      if (!Array.isArray(values) || values.length === 0) {
        throw new BadRequestException(`Attribute ${name} must have values`);
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const product = manager.create(Product, {
        vendorId: vendor.id,
        name: params.dto.name,
        description: params.dto.description ?? null,
        category: params.dto.category ?? null,
        brand: params.dto.brand ?? null,
        basePrice: params.dto.basePrice.toFixed(2),
      });
      const savedProduct = await manager.save(product);

      const normalized = attributeEntries
        .map(([attrName, values]) => ({
          attrName: attrName.trim(),
          values: values.map((v) => v.trim()).filter(Boolean),
        }))
        .filter((x) => x.values.length > 0);

      const attributes: Array<{
        attribute: Attribute;
        values: AttributeValue[];
      }> = [];

      for (const item of normalized) {
        let attribute = await manager.findOne(Attribute, {
          where: { name: item.attrName },
        });
        if (!attribute) {
          attribute = manager.create(Attribute, { name: item.attrName });
          attribute = await manager.save(attribute);
        }

        const valueEntities: AttributeValue[] = [];
        for (const value of item.values) {
          let attributeValue = await manager.findOne(AttributeValue, {
            where: { attributeId: attribute.id, value },
          });
          if (!attributeValue) {
            attributeValue = manager.create(AttributeValue, {
              attributeId: attribute.id,
              value,
            });
            attributeValue = await manager.save(attributeValue);
          }
          valueEntities.push(attributeValue);
        }

        attributes.push({ attribute, values: valueEntities });
      }

      const productAttributeByAttributeId = new Map<string, ProductAttribute>();

      for (const a of attributes) {
        const pa = manager.create(ProductAttribute, {
          productId: savedProduct.id,
          attributeId: a.attribute.id,
        });
        const savedPa = await manager.save(pa);
        productAttributeByAttributeId.set(a.attribute.id, savedPa);

        for (const av of a.values) {
          const pav = manager.create(ProductAttributeValue, {
            productAttributeId: savedPa.id,
            attributeValueId: av.id,
          });
          await manager.save(pav);
        }
      }

      const options = attributes.map((a) => a.values);
      const combos = cartesianProduct(options);

      const usedSkus = new Set<string>();

      for (const combo of combos) {
        const attributeValuesForSku = combo.map((av) => av.value);

        const skuBase = generateSku({
          vendorSlug: vendor.storeSlug,
          productName: savedProduct.name,
          attributeValues: attributeValuesForSku,
        });

        let sku = skuBase;
        let suffix = 1;
        while (usedSkus.has(sku)) {
          suffix += 1;
          sku = `${skuBase}-${suffix}`;
        }
        usedSkus.add(sku);

        const variant = manager.create(ProductVariant, {
          productId: savedProduct.id,
          sku,
          price: savedProduct.basePrice,
        });
        const savedVariant = await manager.save(variant);

        for (const av of combo) {
          const vav = manager.create(VariantAttributeValue, {
            variantId: savedVariant.id,
            attributeValueId: av.id,
          });
          await manager.save(vav);
        }

        const inventory = manager.create(Inventory, {
          variantId: savedVariant.id,
          quantity: params.dto.defaultStock ?? 0,
          reservedQuantity: 0,
          warehouseLocation: params.dto.warehouseLocation ?? null,
        });
        await manager.save(inventory);
      }

      const full = await this.productsRepository.findById(savedProduct.id);
      if (!full) {
        throw new NotFoundException('Product not found after creation');
      }

      return full;
    });
  }

  async listVendorProducts(userId: string): Promise<Product[]> {
    const vendor = await this.vendorsService.getByUserIdOrThrow(userId);
    return this.productsRepository.findByVendorId(vendor.id);
  }

  async getVendorProductById(params: {
    userId: string;
    productId: string;
  }): Promise<Product> {
    const vendor = await this.vendorsService.getByUserIdOrThrow(params.userId);
    const product = await this.productsRepository.findById(params.productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.vendorId !== vendor.id) {
      throw new ForbiddenException('Cannot access this product');
    }
    return product;
  }

  async updateVendorProduct(params: {
    userId: string;
    productId: string;
    dto: UpdateProductDto;
  }): Promise<void> {
    const vendor = await this.vendorsService.getByUserIdOrThrow(params.userId);
    const product = await this.productsRepository.findById(params.productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.vendorId !== vendor.id) {
      throw new ForbiddenException('Cannot access this product');
    }

    const patch: Partial<Pick<Product, 'name' | 'description' | 'basePrice'>> =
      {};
    if (params.dto.name !== undefined) {
      patch.name = params.dto.name;
    }
    if (params.dto.description !== undefined) {
      patch.description = params.dto.description;
    }
    if (params.dto.basePrice !== undefined) {
      patch.basePrice = params.dto.basePrice.toFixed(2);
    }

    await this.productsRepository.update(params.productId, patch);
  }

  async deleteVendorProduct(params: {
    userId: string;
    productId: string;
  }): Promise<void> {
    const vendor = await this.vendorsService.getByUserIdOrThrow(params.userId);
    const product = await this.productsRepository.findById(params.productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.vendorId !== vendor.id) {
      throw new ForbiddenException('Cannot access this product');
    }

    await this.productsRepository.softDelete(params.productId);
  }
}
