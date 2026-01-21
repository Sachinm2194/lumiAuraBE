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

  @Get(':categoryId')
  findOne(@Param('categoryId') categoryId: string) {
    return this.categoriesService.findOne(categoryId);
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
