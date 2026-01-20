// src/modules/Product/Services/tag.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../Entities/tag.entity';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag) private tagRepo: Repository<Tag>,
  ) {}

  async create(name: string): Promise<Tag> {
    // Check if tag already exists
    const existingTag = await this.tagRepo.findOne({
      where: { name: name.toLowerCase().trim() },
    });

    if (existingTag) {
      throw new ConflictException('Tag already exists');
    }

    const tag = this.tagRepo.create({
      name: name.toLowerCase().trim(),
    });
    return this.tagRepo.save(tag);
  }

  async findAll(): Promise<Tag[]> {
    return this.tagRepo.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Tag> {
    const tag = await this.tagRepo.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    return tag;
  }

  async findByName(name: string): Promise<Tag | null> {
    return this.tagRepo.findOne({
      where: { name: name.toLowerCase().trim() },
    });
  }

  async remove(id: number): Promise<void> {
    const tag = await this.findOne(id);
    await this.tagRepo.remove(tag);
  }
}