import { Module } from '@nestjs/common';
import { ProductController } from './Controllers/product.controller';
import { ProductService } from './Services/product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './Entities/product.entity';
import { Category } from './Entities/category.entity';
import { CategoriesController } from './Controllers/categories.controller';
import { ProductVariant } from './Entities/product-variant.entity';
import { ProductImage } from './Entities/product-image.entity';
import { ProductTag } from './Entities/product-tag.entity';
import { Tag } from './Entities/tag.entity';
import { ProductReview } from './Entities/product-review.entity'; // Add this import
import { TagService } from './Services/tag.service';
import { TagController } from './Controllers/tag.controller';
import { ProductReviewService } from './Services/product-review.service';
import { ProductReviewController } from './Controllers/product-review.controller';
import { CategoriesService } from './Services/categories.service'; // Add if missing
import { User } from '../Users/Entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Category,
      ProductVariant,
      ProductImage,
      ProductTag,
      Tag,
      ProductReview, // Add this - CRITICAL!
      User,
    ]),
  ],
  controllers: [
    ProductController,
    CategoriesController,
    TagController,
    ProductReviewController,
  ],
  providers: [
    ProductService,
    CategoriesService, // Add if missing
    TagService,
    ProductReviewService, // Remove duplicate
  ],
})
export class ProductModule {}