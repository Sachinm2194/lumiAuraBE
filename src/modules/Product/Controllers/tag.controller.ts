// src/modules/Product/Controllers/tag.controller.ts
import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    ParseIntPipe,
    BadRequestException,
  } from '@nestjs/common';
  import { TagService } from '../Services/tag.service';
  
  @Controller('tags')
  export class TagController {
    constructor(private readonly tagService: TagService) {}
  
    @Post()
    create(@Body('name') name: string) {
      if (!name || typeof name !== 'string') {
        throw new BadRequestException('Tag name is required');
          }
      return this.tagService.create(name);
    }
  
    @Get()
    findAll() {
      return this.tagService.findAll();
    }
  
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
      return this.tagService.findOne(id);
    }
  
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
      return this.tagService.remove(id);
    }
  }