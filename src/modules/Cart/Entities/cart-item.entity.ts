// src/modules/cart/entities/cart-item.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
  } from 'typeorm';
  import { Cart } from './cart.entity';
  import { Product } from 'src/modules/Product/Entities/product.entity';
  import { ProductVariant } from 'src/modules/Product/Entities/product-variant.entity';
  
  @Entity('cart_items')
  export class CartItem {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    quantity: number;
  
    // ✅ many cart items belong to one cart
    @ManyToOne(() => Cart, cart => cart.items, { onDelete: 'CASCADE' })
    cart: Cart;
  
    // ✅ many cart items belong to one product
    @ManyToOne(() => Product, { eager: true, onDelete: 'CASCADE' })
    product: Product;

    // ✅ many cart items belong to one variant (optional - if not specified, uses default)
    @ManyToOne(() => ProductVariant, { eager: true, nullable: true, onDelete: 'CASCADE' })
    variant?: ProductVariant;
  }
  