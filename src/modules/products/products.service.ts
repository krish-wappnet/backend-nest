import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
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
import { MinioService, UploadedBinaryFile } from '../storage/minio.service';
import { slugify } from './utils/slugify';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly vendorsService: VendorsService,
    private readonly productsRepository: ProductsRepository,
    private readonly minioService: MinioService,
    @InjectRepository(ProductVariant)
    private readonly variantsRepo: Repository<ProductVariant>,
  ) {}

  async createProduct(params: {
    userId: string;
    dto: CreateProductDto;
    variantImages?: UploadedBinaryFile[];
  }): Promise<Product> {
    this.logCreateProductPayload(params);

    const vendor = await this.vendorsService.getByUserIdOrThrow(params.userId);

    const imageBySku = this.prepareVariantImages(params.variantImages);
    const imageAssignedSkus = new Set<string>();
    const singleUploadedImage = this.getSingleUploadedImage(
      params.variantImages,
    );
    let singleUploadedImageUrl: string | null = null;

    const attributeEntries = this.getAttributeEntries(params.dto);
    this.validateAttributes(attributeEntries);

    return this.dataSource.transaction(async (manager) => {
      // 1) Create product
      const savedProduct = await this.createProductEntity(manager, {
        vendorId: vendor.id,
        dto: params.dto,
      });

      // 2) Normalize + ensure attributes/values exist
      const normalized = this.normalizeAttributes(attributeEntries);
      const ensuredAttributes = await this.ensureAttributesExist(
        manager,
        normalized,
      );

      // 3) Link product <-> attributes + values
      await this.createProductAttributeLinks(manager, {
        productId: savedProduct.id,
        attributes: ensuredAttributes,
      });

      // 4) Create variants (cartesian product)
      const combos = this.generateVariantCombinations(ensuredAttributes);
      await this.createVariants(manager, {
        combos,
        vendorStoreSlug: vendor.storeSlug,
        product: savedProduct,
        dto: params.dto,
        imageBySku,
        imageAssignedSkus,
        singleUploadedImage,
        singleUploadedImageUrlRef: {
          get: () => singleUploadedImageUrl,
          set: (v) => {
            singleUploadedImageUrl = v;
          },
        },
      });

      // 5) Load full entity graph
      const full = await this.loadFullProductOrThrow(manager, savedProduct.id);

      // 6) Log any uploaded images that were not assigned to a variant
      this.logUnmatchedUploadedSkus(imageBySku, imageAssignedSkus);

      return full;
    });
  }

  private logCreateProductPayload(params: {
    dto: CreateProductDto;
    variantImages?: UploadedBinaryFile[];
  }): void {
    this.logger.debug(
      `createProduct payload dto=${JSON.stringify(params.dto)} variantImages=${JSON.stringify(
        (params.variantImages ?? []).map((f) => ({
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
        })),
      )}`,
    );
  }

  private prepareVariantImages(
    variantImages?: UploadedBinaryFile[],
  ): Map<string, UploadedBinaryFile> {
    const imageBySku = new Map<string, UploadedBinaryFile>();
    for (const f of variantImages ?? []) {
      const base = f.originalname.replace(/\.[^/.]+$/, '');
      const key = slugify(base);
      if (key) {
        imageBySku.set(key, f);
      }
    }
    return imageBySku;
  }

  private getSingleUploadedImage(
    variantImages?: UploadedBinaryFile[],
  ): UploadedBinaryFile | undefined {
    return (variantImages?.length ?? 0) === 1 ? variantImages?.[0] : undefined;
  }

  private getAttributeEntries(
    dto: CreateProductDto,
  ): Array<[string, string[]]> {
    return Object.entries(dto.attributes ?? {});
  }

  private validateAttributes(
    attributeEntries: Array<[string, string[]]>,
  ): void {
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
  }

  private normalizeAttributes(
    attributeEntries: Array<[string, string[]]>,
  ): Array<{ attrName: string; values: string[] }> | [] {
    return attributeEntries
      .map(([attrName, values]) => ({
        attrName: attrName.trim(),
        values: values.map((v) => v.trim()).filter(Boolean),
      }))
      .filter((x) => x.values.length > 0);
  }

  private async ensureAttributesExist(
    manager: EntityManager,
    normalized: Array<{ attrName: string; values: string[] }>,
  ): Promise<Array<{ attribute: Attribute; values: AttributeValue[] }>> {
    const ensured: Array<{ attribute: Attribute; values: AttributeValue[] }> =
      [];

    for (const item of normalized) {
      const attribute = await this.ensureAttributeExists(
        manager,
        item.attrName,
      );
      const valueEntities: AttributeValue[] = [];
      for (const value of item.values) {
        valueEntities.push(
          await this.ensureAttributeValueExists(manager, {
            attributeId: attribute.id,
            value,
          }),
        );
      }
      ensured.push({ attribute, values: valueEntities });
    }

    return ensured;
  }

  private async ensureAttributeExists(
    manager: EntityManager,
    attrName: string,
  ): Promise<Attribute> {
    let attribute = await manager.findOne(Attribute, {
      where: { name: attrName },
    });
    if (!attribute) {
      attribute = manager.create(Attribute, { name: attrName });
      attribute = await manager.save(attribute);
    }
    return attribute;
  }

  private async ensureAttributeValueExists(
    manager: EntityManager,
    params: { attributeId: string; value: string },
  ): Promise<AttributeValue> {
    let attributeValue = await manager.findOne(AttributeValue, {
      where: { attributeId: params.attributeId, value: params.value },
    });
    if (!attributeValue) {
      attributeValue = manager.create(AttributeValue, {
        attributeId: params.attributeId,
        value: params.value,
      });
      attributeValue = await manager.save(attributeValue);
    }
    return attributeValue;
  }

  private async createProductEntity(
    manager: EntityManager,
    params: { vendorId: string; dto: CreateProductDto },
  ): Promise<Product> {
    const product = manager.create(Product, {
      vendorId: params.vendorId,
      name: params.dto.name,
      description: params.dto.description ?? null,
      category: params.dto.category ?? null,
      brand: params.dto.brand ?? null,
      basePrice: params.dto.basePrice.toFixed(2),
    });
    return manager.save(product);
  }

  private async createProductAttributeLinks(
    manager: EntityManager,
    params: {
      productId: string;
      attributes: Array<{ attribute: Attribute; values: AttributeValue[] }>;
    },
  ): Promise<Map<string, ProductAttribute>> {
    const productAttributeByAttributeId = new Map<string, ProductAttribute>();

    for (const a of params.attributes) {
      const pa = manager.create(ProductAttribute, {
        productId: params.productId,
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

    return productAttributeByAttributeId;
  }

  private generateVariantCombinations(
    attributes: Array<{ attribute: Attribute; values: AttributeValue[] }>,
  ): AttributeValue[][] {
    const options = attributes.map((a) => a.values);
    return cartesianProduct(options);
  }

  private async createVariants(
    manager: EntityManager,
    params: {
      combos: AttributeValue[][];
      vendorStoreSlug: string;
      product: Product;
      dto: CreateProductDto;
      imageBySku: Map<string, UploadedBinaryFile>;
      imageAssignedSkus: Set<string>;
      singleUploadedImage?: UploadedBinaryFile;
      singleUploadedImageUrlRef: {
        get: () => string | null;
        set: (v: string | null) => void;
      };
    },
  ): Promise<void> {
    const usedSkus = new Set<string>();

    for (const combo of params.combos) {
      const sku = this.generateUniqueSku({
        usedSkus,
        vendorSlug: params.vendorStoreSlug,
        productName: params.product.name,
        attributeValues: combo.map((av) => av.value),
      });

      const savedVariant = await this.createVariantEntity(manager, {
        productId: params.product.id,
        sku,
        price: params.product.basePrice,
      });

      this.logger.debug(
        `createProduct generated variant sku=${savedVariant.sku}`,
      );

      await this.attachVariantImages(manager, {
        productId: params.product.id,
        variant: savedVariant,
        imageBySku: params.imageBySku,
        imageAssignedSkus: params.imageAssignedSkus,
        singleUploadedImage: params.singleUploadedImage,
        singleUploadedImageUrlRef: params.singleUploadedImageUrlRef,
      });

      await this.linkVariantAttributes(manager, {
        variantId: savedVariant.id,
        attributeValues: combo,
      });

      await this.createInventoryRecords(manager, {
        variantId: savedVariant.id,
        dto: params.dto,
      });
    }
  }

  private generateUniqueSku(params: {
    usedSkus: Set<string>;
    vendorSlug: string;
    productName: string;
    attributeValues: string[];
  }): string {
    const skuBase = generateSku({
      vendorSlug: params.vendorSlug,
      productName: params.productName,
      attributeValues: params.attributeValues,
    });

    let sku = skuBase;
    let suffix = 1;
    while (params.usedSkus.has(sku)) {
      suffix += 1;
      sku = `${skuBase}-${suffix}`;
    }
    params.usedSkus.add(sku);
    return sku;
  }

  private async createVariantEntity(
    manager: EntityManager,
    params: { productId: string; sku: string; price: string },
  ): Promise<ProductVariant> {
    const variant = manager.create(ProductVariant, {
      productId: params.productId,
      sku: params.sku,
      price: params.price,
    });
    return manager.save(variant);
  }

  private async attachVariantImages(
    manager: EntityManager,
    params: {
      productId: string;
      variant: ProductVariant;
      imageBySku: Map<string, UploadedBinaryFile>;
      imageAssignedSkus: Set<string>;
      singleUploadedImage?: UploadedBinaryFile;
      singleUploadedImageUrlRef: {
        get: () => string | null;
        set: (v: string | null) => void;
      };
    },
  ): Promise<void> {
    const image = params.imageBySku.get(params.variant.sku);
    if (image) {
      params.imageAssignedSkus.add(params.variant.sku);
      const uploaded = await this.minioService.uploadProductVariantImage({
        productId: params.productId,
        variantId: params.variant.id,
        file: image,
      });
      params.variant.imageUrl = uploaded.url;
      await manager.save(params.variant);
      return;
    }

    if (params.singleUploadedImage) {
      if (!params.singleUploadedImageUrlRef.get()) {
        this.logger.debug(
          `createProduct applying single uploaded image (${params.singleUploadedImage.originalname}) as default for variants`,
        );
        const uploaded = await this.minioService.uploadProductVariantImage({
          productId: params.productId,
          variantId: params.variant.id,
          file: params.singleUploadedImage,
        });
        params.singleUploadedImageUrlRef.set(uploaded.url);
      }

      params.variant.imageUrl = params.singleUploadedImageUrlRef.get();
      await manager.save(params.variant);
      return;
    }

    this.logger.debug(
      `createProduct no image matched for variant sku=${params.variant.sku}. Expected an uploaded filename like ${params.variant.sku}.jpg (or .png).`,
    );
  }

  private async linkVariantAttributes(
    manager: EntityManager,
    params: { variantId: string; attributeValues: AttributeValue[] },
  ): Promise<void> {
    for (const av of params.attributeValues) {
      const vav = manager.create(VariantAttributeValue, {
        variantId: params.variantId,
        attributeValueId: av.id,
      });
      await manager.save(vav);
    }
  }

  private async createInventoryRecords(
    manager: EntityManager,
    params: { variantId: string; dto: CreateProductDto },
  ): Promise<void> {
    const inventory = manager.create(Inventory, {
      variantId: params.variantId,
      quantity: params.dto.defaultStock ?? 0,
      reservedQuantity: 0,
      warehouseLocation: params.dto.warehouseLocation ?? null,
    });
    await manager.save(inventory);
  }

  private async loadFullProductOrThrow(
    manager: EntityManager,
    productId: string,
  ): Promise<Product> {
    const full = await manager.getRepository(Product).findOne({
      where: { id: productId },
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
    if (!full) {
      throw new NotFoundException('Product not found after creation');
    }
    return full;
  }

  private logUnmatchedUploadedSkus(
    imageBySku: Map<string, UploadedBinaryFile>,
    imageAssignedSkus: Set<string>,
  ): void {
    const uploadedSkus = Array.from(imageBySku.keys());
    const unmatched = uploadedSkus.filter((sku) => !imageAssignedSkus.has(sku));
    if (unmatched.length > 0) {
      this.logger.debug(
        `createProduct uploaded images that did not match any generated variant SKU: ${unmatched.join(', ')}`,
      );
    }
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

  async uploadVariantImage(params: {
    userId: string;
    productId: string;
    variantId: string;
    file: UploadedBinaryFile | undefined;
  }): Promise<{ imageUrl: string }> {
    if (!params.file) {
      throw new BadRequestException('Image file is required');
    }

    const vendor = await this.vendorsService.getByUserIdOrThrow(params.userId);
    const product = await this.productsRepository.findById(params.productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.vendorId !== vendor.id) {
      throw new ForbiddenException('Cannot access this product');
    }

    const variant = await this.variantsRepo.findOne({
      where: { id: params.variantId, productId: params.productId },
    });
    if (!variant) {
      throw new NotFoundException('Variant not found for this product');
    }

    const uploaded = await this.minioService.uploadProductVariantImage({
      productId: params.productId,
      variantId: params.variantId,
      file: params.file,
    });

    variant.imageUrl = uploaded.url;
    await this.variantsRepo.save(variant);

    return { imageUrl: uploaded.url };
  }
}
