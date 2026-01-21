// src/modules/products/categories.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../Entities/category.entity';
import { CreateCategoryDto } from '../DTO/create-category.dto';
import { UpdateCategoryDto } from '../DTO/update-category.dto';
import { v4 as uuidv4 } from 'uuid';


@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private categoryRepo: Repository<Category>) {}

  create(dto: CreateCategoryDto) {
    const category = this.categoryRepo.create(dto);
    return this.categoryRepo.save(category);
  }

  findAll() {
    return this.categoryRepo.find();
  }

  async findOne(categoryId: string) {
    // Find by UUID
    const category = await this.categoryRepo.findOne({ where: { categoryId } });
    if (!category) throw new NotFoundException('Category not found');
    
    // Backfill categoryId if missing (for existing records)
    if (!category.categoryId) {
      category.categoryId = uuidv4();
      await this.categoryRepo.save(category);
    }
    
    return category;
  }

  async update(categoryId: string, dto: UpdateCategoryDto) {
    // Find by UUID
    const category = await this.findOne(categoryId);
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(categoryId: string) {
    // Find by UUID
    const category = await this.findOne(categoryId);
    return this.categoryRepo.remove(category);
  }
}
