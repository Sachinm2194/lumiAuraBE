// src/modules/products/entities/product.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  BeforeInsert,
} from 'typeorm';
import { Category } from './category.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number; // internal DB id

  @Column({ type: 'uuid', unique: true })
  productId: string; // public unique GUID

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('int', { default: 0 })
  quantity: number;

  @Column('json', { nullable: true })
  images: string[]; // URL or path to product image

  @ManyToOne(() => Category, (category) => category.products, { eager: true })
  category: Category;

  // Generate UUID before inserting into DB
  @BeforeInsert()
  generateUUID() {
    this.productId = uuidv4();
  }
}
