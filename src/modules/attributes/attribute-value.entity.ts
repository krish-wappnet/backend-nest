import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Column } from 'typeorm';
import { Attribute } from './attribute.entity';

@Entity({ name: 'attribute_values' })
@Index(['attributeId', 'value'], { unique: true })
@Index(['attributeId'])
export class AttributeValue {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  attributeId!: string;

  @ManyToOne(
    (): typeof Attribute => Attribute,
    (attribute: Attribute) => attribute.values,
    { onDelete: 'CASCADE' },
  )
  attribute!: Attribute;

  @Column({ type: 'varchar', length: 120 })
  value!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
