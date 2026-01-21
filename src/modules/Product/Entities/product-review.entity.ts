// src/modules/products/entities/product-review.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    Index,
    CreateDateColumn,
    JoinColumn,
    BeforeInsert,
  } from 'typeorm';
  import { Product } from './product.entity';
  import { v4 as uuidv4 } from 'uuid';
  
  @Entity('product_reviews')
  @Index(['productId'])
  @Index(['rating'])
  export class ProductReview {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'uuid', unique: true, nullable: true })
    reviewId?: string;
  
    // Foreign key (explicit)
    @Column()
    productId: number;
  
    @ManyToOne(() => Product, {
      onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'productId' })
    product: Product;
  
    // User reference (keep simple for now)
    @Column({ nullable: true })
    userId: number;
  
    // Review data
    @Column({ type: 'int' })
    rating: number; // 1 to 5
  
    @Column({ type: 'text', nullable: true })
    comment: string;
  
    // Trust signal
    @Column({ default: false })
    isVerifiedPurchase: boolean;
  
    // Moderation (future-safe)
    @Column({ default: true })
    isActive: boolean;
  
    @CreateDateColumn()
    createdAt: Date;

    @BeforeInsert()
    generateReviewId() {
      // Generate unique UUID for reviewId if not provided
      if (!this.reviewId) {
        this.reviewId = uuidv4();
      }
    }
  }
  