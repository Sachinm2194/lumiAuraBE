import { User } from '../../Users/Entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', unique: true, nullable: true })
  addressId?: string;

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column()
  fullName: string;

  @Column()
  addressLine1: string;

  @Column({ nullable: true })
  addressLine2?: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  postalCode: string;

  @Column()
  country: string;

  @Column()
  phone: string;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ nullable: true })
  addressType: string; // 'home', 'work', 'other', etc.

  @Column({ nullable: true })
  label: string; // Custom label like "Home", "Office", etc.

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @BeforeInsert()
  generateAddressId() {
    if (!this.addressId) {
      this.addressId = uuidv4();
    }
  }
}

