// src/modules/cart/cart.service.ts
import {
    Injectable,
    NotFoundException,
    BadRequestException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
import { Cart } from './Entities/cart.entity';
import { CartItem } from './Entities/cart-item.entity';
import { User } from '../Users/Entities/user.entity';
import { Product } from '../Product/Entities/product.entity';

  
  @Injectable()
  export class CartService {
    constructor(
      @InjectRepository(Cart) private cartRepo: Repository<Cart>,
      @InjectRepository(CartItem) private cartItemRepo: Repository<CartItem>,
      @InjectRepository(User) private userRepo: Repository<User>,
      @InjectRepository(Product) private productRepo: Repository<Product>,
    ) {}
  
    /** 🛒 Get or create cart for a user */
    async getOrCreateCart(userId: number): Promise<Cart> {
      let cart = await this.cartRepo.findOne({
        where: { user: { id: userId } },
        relations: ['items', 'items.product'],
      });
  
      if (!cart) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
  
        cart = this.cartRepo.create({ user, items: [] });
        await this.cartRepo.save(cart);
      }
  
      return cart;
    }
  
    /** ➕ Add product to cart */
    async addToCart(userId: number, productId: number, quantity: number) {
      const cart = await this.getOrCreateCart(userId);
  
      const product = await this.productRepo.findOne({ where: { id: productId }, relations: ['variants'] });
      if (!product) throw new NotFoundException('Product not found');
  
      const variant = product.variants?.find(v => v.isDefault) || product.variants?.[0];
      if (!variant) throw new BadRequestException('Product has no variants');
    
      // Check stock from variant
      if (variant.quantity < quantity) {
        throw new BadRequestException('Not enough stock available');
      }
  
      let cartItem = cart.items.find((item) => item.product.id === productId);
  
      if (cartItem) {
        cartItem.quantity += quantity;
      } else {
        cartItem = this.cartItemRepo.create({ cart, product, quantity });
        cart.items.push(cartItem);
      }
  
      await this.cartRepo.save(cart);
      return cart;
    }
  
    /** 🗑 Remove product from cart */
    async removeFromCart(userId: number, productId: number) {
      const cart = await this.getOrCreateCart(userId);
  
      const cartItem = cart.items.find((item) => item.product.id === productId);
      if (!cartItem) throw new NotFoundException('Product not in cart');
  
      await this.cartItemRepo.remove(cartItem);
      return this.getOrCreateCart(userId); // return updated cart
    }
  
    /** 📦 Get user cart */
    async getCart(userId: number) {
      return this.getOrCreateCart(userId);
    }
  
    /** ❌ Clear cart */
    async clearCart(userId: number) {
      const cart = await this.getOrCreateCart(userId);
      await this.cartItemRepo.remove(cart.items);
      cart.items = [];
      return this.cartRepo.save(cart);
    }
  }
  