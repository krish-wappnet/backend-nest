import {
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Column } from 'typeorm';
import { AttributeValue } from './attribute-value.entity';

@Entity({ name: 'attributes' })
export class Attribute {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @OneToMany(
    (): typeof AttributeValue => AttributeValue,
    (value: AttributeValue) => value.attribute,
  )
  values?: AttributeValue[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
