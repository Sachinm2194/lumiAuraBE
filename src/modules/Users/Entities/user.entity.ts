// src/modules/users/entities/user.entity.ts
import { Cart } from '../../Cart/Entities/cart.entity';
import { Order } from '../../Order/entities/order.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'varchar', default: 'email', nullable: false })
  authProvider: string; // 'email' or 'google'

  @Column({ nullable: true })
  firstName: string;
  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verificationToken: string;

  @Column({ type: 'timestamptz', nullable: true })
  verificationTokenExpiry: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // 👇 One-to-One relation
  @OneToOne(() => Cart, cart => cart.user)
  cart: Cart;

  // 👇 One-to-Many relation with orders
  @OneToMany(() => Order, order => order.user)
  orders: Order[];
}
