import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductVariant } from './product-variant.entity';
import { AttributeValue } from '../attributes/attribute-value.entity';

@Entity({ name: 'variant_attribute_values' })
@Index(['variantId', 'attributeValueId'], { unique: true })
export class VariantAttributeValue {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  variantId!: string;

  @ManyToOne(
    (): typeof ProductVariant => ProductVariant,
    (variant: ProductVariant) => variant.attributeValues,
    { onDelete: 'CASCADE' },
  )
  variant!: ProductVariant;

  @Index()
  @Column({ type: 'uuid' })
  attributeValueId!: string;

  @ManyToOne((): typeof AttributeValue => AttributeValue, {
    onDelete: 'RESTRICT',
  })
  attributeValue!: AttributeValue;
}
