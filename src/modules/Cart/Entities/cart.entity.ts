// src/modules/cart/entities/cart.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    OneToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { CartItem } from './cart-item.entity';
import { User } from 'src/modules/Users/Entities/user.entity';
  
  @Entity('carts')
  export class Cart {
    @PrimaryGeneratedColumn()
    id: number;
  
    // ✅ one cart belongs to one user
    @OneToOne(() => User, user => user.cart, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;
  
    // ✅ one cart can have many cart items
    @OneToMany(() => CartItem, item => item.cart, { cascade: true })
    items: CartItem[];
  
    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
  
    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
  }
  