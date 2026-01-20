// src/modules/products/entities/product-image.entity.ts
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
  import { ProductVariant } from './product-variant.entity';
  
  @Entity('product_images')
  @Index(['productId'])
  @Index(['variantId'])
  export class ProductImage {
    @PrimaryGeneratedColumn()
    id: number;
  
    // Foreign keys (explicit)
    @Column()
    productId: number;
  
    @Column({ nullable: true })
    variantId: number;
  
    @ManyToOne(() => Product, (product) => product.images, {
      onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'productId' })
    product: Product;
  
    @ManyToOne(() => ProductVariant, {
      onDelete: 'CASCADE',
      nullable: true,
    })
    @JoinColumn({ name: 'variantId' })
    variant: ProductVariant;
  
    // Image data
    @Column({ type: 'text' })
    imageUrl: string;
  
    @Column({ length: 255, nullable: true })
    altText: string;
  
    // Display control
    @Column({ default: false })
    isPrimary: boolean;
  
    @Column({ default: 0 })
    sortOrder: number;
  
    @CreateDateColumn()
    createdAt: Date;
  }
  