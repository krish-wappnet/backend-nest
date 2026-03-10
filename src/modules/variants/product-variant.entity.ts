import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../products/product.entity';
import { VariantAttributeValue } from './variant-attribute-value.entity';
import { Inventory } from '../inventory/inventory.entity';

export enum ProductVariantStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Entity({ name: 'product_variants' })
@Index(['productId', 'sku'], { unique: true })
@Index(['productId'])
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(
    (): typeof Product => Product,
    (product: Product) => product.variants,
    { onDelete: 'CASCADE' },
  )
  product!: Product;

  @Column({ type: 'varchar', length: 255 })
  sku!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price!: string;

  @Column({ type: 'text', nullable: true })
  imageUrl!: string | null;

  @Column({
    type: 'enum',
    enum: ProductVariantStatus,
    default: ProductVariantStatus.ACTIVE,
  })
  status!: ProductVariantStatus;

  @OneToMany(
    (): typeof VariantAttributeValue => VariantAttributeValue,
    (vav: VariantAttributeValue) => vav.variant,
  )
  attributeValues?: VariantAttributeValue[];

  @OneToOne(
    (): typeof Inventory => Inventory,
    (inventory: Inventory) => inventory.variant,
  )
  inventory?: Inventory;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
