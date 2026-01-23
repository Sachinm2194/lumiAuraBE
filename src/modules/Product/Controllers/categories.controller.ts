import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { CategoriesService } from '../Services/categories.service';
import { CreateCategoryDto } from '../DTO/create-category.dto';
import { UpdateCategoryDto } from '../DTO/update-category.dto';


@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post("addNew")
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  /**
   * Explicit endpoint for slug-based lookup (alternative to smart routing)
   * GET /categories/slug/face-care
   */
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  /**
   * Get category by identifier (UUID or slug) - Smart routing
   * Examples:
   * - GET /categories/881aed84-e14c-4c5d-9300-91874ba81847 (UUID)
   * - GET /categories/face-care (slug)
   */
  @Get(':identifier')
  findOne(@Param('identifier') identifier: string) {
    return this.categoriesService.findOne(identifier);
  }

  @Patch(':categoryId')
  update(@Param('categoryId') categoryId: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(categoryId, dto);
  }

  @Delete(':categoryId')
  remove(@Param('categoryId') categoryId: string) {
    return this.categoriesService.remove(categoryId);
  }
}
