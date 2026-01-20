// src/modules/products/entities/tag.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    CreateDateColumn,
  } from 'typeorm';
  
  @Entity('tags')
  @Index(['name'], { unique: true })
  export class Tag {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ length: 100 })
    name: string; // vegan, fragrance-free
  
    @CreateDateColumn()
    createdAt: Date;
  }
  