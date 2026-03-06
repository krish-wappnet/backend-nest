import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductAttribute } from './product-attribute.entity';
import { AttributeValue } from '../attributes/attribute-value.entity';

@Entity({ name: 'product_attribute_values' })
@Index(['productAttributeId', 'attributeValueId'], { unique: true })
export class ProductAttributeValue {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  productAttributeId!: string;

  @ManyToOne(
    (): typeof ProductAttribute => ProductAttribute,
    (pa: ProductAttribute) => pa.values,
    { onDelete: 'CASCADE' },
  )
  productAttribute!: ProductAttribute;

  @Index()
  @Column({ type: 'uuid' })
  attributeValueId!: string;

  @ManyToOne((): typeof AttributeValue => AttributeValue, {
    onDelete: 'RESTRICT',
  })
  attributeValue!: AttributeValue;
}
