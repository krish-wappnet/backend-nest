import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductVariant } from '../variants/product-variant.entity';

@Entity({ name: 'inventory' })
@Index('UQ_inventory_variant_id', ['variantId'], { unique: true })
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  variantId!: string;

  @OneToOne(
    (): typeof ProductVariant => ProductVariant,
    (variant: ProductVariant) => variant.inventory,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'variantId' })
  variant!: ProductVariant;

  @Column({ type: 'int', default: 0 })
  quantity!: number;

  @Column({ type: 'int', default: 0 })
  reservedQuantity!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  warehouseLocation!: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
