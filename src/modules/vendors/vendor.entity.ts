import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VendorStatus } from '../users/vendor-status.enum';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';

@Entity({ name: 'vendors' })
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  userId!: string;

  @OneToOne(() => User, (user) => user.vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 255 })
  storeName!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  storeSlug!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  businessEmail!: string;

  @Column({ type: 'varchar', length: 32 })
  phone!: string;

  @Column({ type: 'enum', enum: VendorStatus, default: VendorStatus.PENDING })
  status!: VendorStatus;

  @OneToMany(
    (): typeof Product => Product,
    (product: Product) => product.vendor,
  )
  products?: Product[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
