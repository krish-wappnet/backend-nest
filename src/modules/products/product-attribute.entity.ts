import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { Attribute } from '../attributes/attribute.entity';
import { ProductAttributeValue } from './product-attribute-value.entity';

@Entity({ name: 'product_attributes' })
@Index(['productId', 'attributeId'], { unique: true })
export class ProductAttribute {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(
    (): typeof Product => Product,
    (product: Product) => product.productAttributes,
    { onDelete: 'CASCADE' },
  )
  product!: Product;

  @Index()
  @Column({ type: 'uuid' })
  attributeId!: string;

  @ManyToOne((): typeof Attribute => Attribute, { onDelete: 'RESTRICT' })
  attribute!: Attribute;

  @OneToMany(
    (): typeof ProductAttributeValue => ProductAttributeValue,
    (pav: ProductAttributeValue) => pav.productAttribute,
  )
  values?: ProductAttributeValue[];
}
