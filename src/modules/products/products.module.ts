import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductAttribute } from './product-attribute.entity';
import { ProductAttributeValue } from './product-attribute-value.entity';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { VendorsModule } from '../vendors/vendors.module';
import { Attribute } from '../attributes/attribute.entity';
import { AttributeValue } from '../attributes/attribute-value.entity';
import { ProductVariant } from '../variants/product-variant.entity';
import { VariantAttributeValue } from '../variants/variant-attribute-value.entity';
import { Inventory } from '../inventory/inventory.entity';
import { UsersModule } from '../users/users.module';
import { VendorApprovedGuard } from '../../guards/vendor-approved.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductAttribute,
      ProductAttributeValue,
      Attribute,
      AttributeValue,
      ProductVariant,
      VariantAttributeValue,
      Inventory,
    ]),
    VendorsModule,
    UsersModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsRepository, ProductsService, VendorApprovedGuard],
})
export class ProductsModule {}
