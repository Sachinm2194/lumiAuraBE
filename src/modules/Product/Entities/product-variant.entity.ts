// src/modules/products/entities/product-variant.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    Index,
    CreateDateColumn,
    JoinColumn,
  } from 'typeorm';
  import { Product } from './product.entity';
  
  @Entity('product_variants')
  @Index(['sku'], { unique: true })
  @Index(['productId'])
  export class ProductVariant {
    @PrimaryGeneratedColumn()
    id: number;
  
    // Foreign key (explicit for performance & clarity)
    @Column()
    productId: number;
  
    @ManyToOne(() => Product, (product) => product.variants, {
      onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'productId' })
    product: Product;
  
    // Business fields
    @Column({ length: 100 })
    sku: string;
  
    @Column({ length: 100 })
    variantName: string; // 30ml / 50ml
  
    @Column('decimal', { precision: 10, scale: 2 })
    mrp: number;
  
    @Column('decimal', { precision: 10, scale: 2 })
    sellingPrice: number;
  
    @Column({ type: 'int', default: 0 })
    quantity: number;
  
    @Column({ default: false })
    isDefault: boolean;
  
    @CreateDateColumn()
    createdAt: Date;
  }
  