// src/modules/Product/Entities/product-tag.entity.ts
import {
  Entity,
  PrimaryColumn, // Use PrimaryColumn instead
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from './product.entity';
import { Tag } from './tag.entity';

@Entity('product_tags')
export class ProductTag {
  @PrimaryColumn()
  productId: number;

  @PrimaryColumn()
  tagId: number;

  @ManyToOne(() => Product, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => Tag, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tagId' })
  tag: Tag;
}