import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductVariant } from './product-variant.entity';
import { VariantAttributeValue } from './variant-attribute-value.entity';
import { VariantsRepository } from './variants.repository';
import { VariantsService } from './variants.service';
import { VariantsController } from './variants.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductVariant, VariantAttributeValue])],
  controllers: [VariantsController],
  providers: [VariantsRepository, VariantsService],
  exports: [VariantsRepository, VariantsService],
})
export class VariantsModule {}
