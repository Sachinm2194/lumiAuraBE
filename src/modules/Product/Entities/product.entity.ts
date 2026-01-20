// src/modules/products/entities/product.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  BeforeInsert,
  BeforeUpdate,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { ProductTag } from './product-tag.entity';
import { ProductReview } from './product-review.entity';

@Entity('products')
@Index(['status'])
@Index(['isFeatured'])
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', unique: true })
  productId: string;

  @Column()
  name: string;

  @Index({ unique: true })
  @Column()
  slug: string;

  @Column({ length: 255, nullable: true })
  shortDescription: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Skincare-specific
  @Column({ type: 'text', array: true, nullable: true })
  ingredients: string[];

  @Column({ type: 'text', array: true, nullable: true })
  benefits: string[];

  @Column({ type: 'text', nullable: true })
  howToUse: string;

  @Column({ type: 'text', nullable: true })
  warnings: string;

  @Column({ type: 'text', array: true, nullable: true })
  skinType: string[];

  @Column({ type: 'text', array: true, nullable: true })
  concerns: string[];

  @Column({ nullable: true })
  suitableFor: string;

  // Review snapshot
  @Column('decimal', { precision: 2, scale: 1, default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  reviewCount: number;

  // Flags
  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  isNew: boolean;

  @Column({ default: 'draft' })
  status: 'draft' | 'active' | 'archived';

  // Category relation
  @Column()
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  // Relations
  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, (image) => image.product, {
    cascade: true,
  })
  images: ProductImage[];

  @OneToMany(() => ProductTag, (tag) => tag.product, {
    cascade: true,
  })
  tags: ProductTag[];

  @OneToMany(() => ProductReview, (review) => review.product)
  reviews: ProductReview[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateProductIdAndSlug() {
    // Generate unique UUID for productId if not provided
    if (!this.productId) {
      this.productId = uuidv4();
    }

    // Auto-generate slug from product name if not provided by admin
    if (!this.slug) {
      this.slug = slugify(this.name, {
        lower: true,
        strict: true,
        trim: true,
      });
    } else {
      // If admin manually provides slug, sanitize it to be URL-friendly
      this.slug = slugify(this.slug, {
        lower: true,
        strict: true,
        trim: true,
      });
    }
  }

  @BeforeUpdate()
  updateSlugIfNeeded() {
    // Auto-generate slug if missing (edge case - should not happen after creation)
    if (!this.slug && this.name) {
      this.slug = slugify(this.name, {
        lower: true,
        strict: true,
        trim: true,
      });
    } else if (this.slug) {
      // If admin manually provides slug (rare case), sanitize it to be URL-friendly
      this.slug = slugify(this.slug, {
        lower: true,
        strict: true,
        trim: true,
      });
    }
  }
}