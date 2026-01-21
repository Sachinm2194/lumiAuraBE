// src/modules/products/entities/tag.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    CreateDateColumn,
    BeforeInsert,
  } from 'typeorm';
  import { v4 as uuidv4 } from 'uuid';
  
  @Entity('tags')
  @Index(['name'], { unique: true })
  export class Tag {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'uuid', unique: true, nullable: true })
    tagId?: string;
  
    @Column({ length: 100 })
    name: string; // vegan, fragrance-free
  
    @CreateDateColumn()
    createdAt: Date;

    @BeforeInsert()
    generateTagId() {
      // Generate unique UUID for tagId if not provided
      if (!this.tagId) {
        this.tagId = uuidv4();
      }
    }
  }
  