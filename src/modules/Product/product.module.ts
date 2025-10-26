import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './Entities/product.entity';
import { Category } from './Entities/category.entity';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category])],
  controllers: [ProductController,CategoriesController],
  providers: [ProductService,CategoriesService]
})
export class ProductModule {}
