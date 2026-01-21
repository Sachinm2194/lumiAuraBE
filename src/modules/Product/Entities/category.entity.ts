// src/modules/products/entities/category.entity.ts
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
import { Product } from './product.entity';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';

@Entity('categories')
@Index(['slug'], { unique: true })
@Index(['status'])
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', unique: true, nullable: true })
  categoryId?: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  slug: string; // Auto-generated from name

  @Column({ type: 'text', nullable: true })
  description: string;

  // Hierarchy (Face → Serum)
  @Column({ nullable: true })
  parentId: number;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parent: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  // Control
  @Column({ default: 'active' })
  status: 'active' | 'inactive';

  // Relations
  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateCategoryIdAndSlug() {
    // Generate unique UUID for categoryId if not provided
    if (!this.categoryId) {
      this.categoryId = uuidv4();
    }

    // Auto-generate slug from category name if not provided by admin
    if (!this.slug) {
      this.slug = slugify(this.name, {
        lower: true,
        strict: true,
        trim: true,
      });
    } else {
      // If admin manually provides slug (rare case), sanitize it to be URL-friendly
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
