// src/modules/Product/Services/tag.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../Entities/tag.entity';
import { v4 as uuidv4 } from 'uuid';

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

  async findOne(tagId: string): Promise<Tag> {
    // Find by UUID
    const tag = await this.tagRepo.findOne({ where: { tagId } });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    
    // Backfill tagId if missing (for existing records)
    if (!tag.tagId) {
      tag.tagId = uuidv4();
      await this.tagRepo.save(tag);
    }
    
    return tag;
  }

  async findByName(name: string): Promise<Tag | null> {
    return this.tagRepo.findOne({
      where: { name: name.toLowerCase().trim() },
    });
  }

  async remove(tagId: string): Promise<void> {
    // Find by UUID
    const tag = await this.findOne(tagId);
    await this.tagRepo.remove(tag);
  }
}