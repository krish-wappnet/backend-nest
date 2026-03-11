import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Vendor } from '../vendors/vendor.entity';
import { ProductVariant } from '../variants/product-variant.entity';
import { ProductAttribute } from './product-attribute.entity';
import { User } from '../users/user.entity';

export enum ProductCategory {
  MENS = 'MENS',
  WOMENS = 'WOMENS',
  KIDS = 'KIDS',
}

export enum ProductStatus {
  DRAFT = 1,
  ACTIVE = 2,
  ARCHIVED = 3,
}

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  vendorId!: string;

  @ManyToOne((): typeof Vendor => Vendor, (vendor: Vendor) => vendor.products, {
    onDelete: 'RESTRICT',
  })
  vendor!: Vendor;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: ProductCategory,
    nullable: true,
  })
  category!: ProductCategory | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  brand!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  basePrice!: string;

  @Column({ type: 'smallint', default: ProductStatus.DRAFT })
  status!: ProductStatus;

  @OneToMany(
    (): typeof ProductVariant => ProductVariant,
    (variant: ProductVariant) => variant.product,
  )
  variants?: ProductVariant[];

  @OneToMany(
    (): typeof ProductAttribute => ProductAttribute,
    (pa: ProductAttribute) => pa.product,
  )
  productAttributes?: ProductAttribute[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => ProductLike, (like) => like.product)
  productLikes!: ProductLike[];

  @Column({ type: 'boolean', default: false })
  featured!: boolean;
}

@Entity()
export class ProductLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.productLikes)
  user: User;

  @ManyToOne(() => Product, (product) => product.productLikes)
  product: Product;

  @CreateDateColumn()
  createdAt: Date;
}
