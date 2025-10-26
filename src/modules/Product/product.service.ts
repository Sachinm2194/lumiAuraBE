// src/modules/products/products.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './Entities/product.entity';
import { Category } from './Entities/category.entity';
import { CreateProductDto } from './DTO/create-product.dto';
import { UpdateProductDto } from './DTO/update-product.dto';


@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
  ) {}

  async create(dto: CreateProductDto & { images?: string[] }) {
    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
    if (!category) throw new BadRequestException('Category not found');
  
    const product = this.productRepo.create({ ...dto, category });
    return this.productRepo.save(product);
  }
  

  findAll() {
    return this.productRepo.find();
  }

  async findOneById(id: number) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findOneByGuid(productId: string) {
    const product = await this.productRepo.findOne({ where: { productId } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.findOneById(id);
    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) throw new BadRequestException('Category not found');
      product.category = category;
    }
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async remove(id: number) {
    const product = await this.findOneById(id);
    return this.productRepo.remove(product);
  }

  async removeMultiple(ids: number[]) {
    const products = await this.productRepo.find({
      where: ids.map(id => ({ id }))
    });
    if (products.length === 0) {
      throw new NotFoundException('No products found with the provided IDs');
    }
    return this.productRepo.remove(products);
  }
}
