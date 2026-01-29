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
    async getOrCreateCart(userId: string): Promise<Cart> {
      const user = await this.userRepo.findOne({ where: { userId: userId } });
      if (!user) throw new NotFoundException('User not found');

      let cart = await this.cartRepo.findOne({
        where: { user: { id: user.id } },
        relations: ['items', 'items.product', 'items.product.variants', 'items.product.images'],
      });

      if (!cart) {
        cart = this.cartRepo.create({ user, items: [] });
        await this.cartRepo.save(cart);
      }

      return cart;
    }

    /** 📦 Get user cart with optional search */
    async getCartWithSearch(userId: string, search?: string): Promise<Cart> {
      const user = await this.userRepo.findOne({ where: { userId: userId } });
      if (!user) throw new NotFoundException('User not found');

      // First, get or create the cart without search filtering
      let cart = await this.cartRepo.findOne({
        where: { user: { id: user.id } },
        relations: ['items', 'items.product', 'items.product.variants', 'items.product.images'],
      });

      if (!cart) {
        // Create cart if it doesn't exist
        cart = this.cartRepo.create({ user, items: [] });
        await this.cartRepo.save(cart);
        // Return the cart with empty items since no search can match
        return { ...cart, items: [] };
      }

      // If no search term, return the full cart
      if (!search || !search.trim()) {
        return cart;
      }

      // Apply search filtering to items
      const query = this.cartRepo
        .createQueryBuilder('cart')
        .leftJoinAndSelect('cart.items', 'items')
        .leftJoinAndSelect('items.product', 'product')
        .leftJoinAndSelect('product.variants', 'variants')
        .leftJoinAndSelect('product.images', 'images')
        .where('cart.user = :userId', { userId: user.id })
        .andWhere(
          '(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search))',
          { search: `%${search.trim()}%` }
        );

      const cartWithFilteredItems = await query.getOne();

      // If search filtering resulted in no items, return cart with empty items array
      if (!cartWithFilteredItems) {
        return { ...cart, items: [] };
      }

      return cartWithFilteredItems;
    }
  
    /** ➕ Add product to cart */
    async addToCart(userId: string, productId: string, quantity: number) { // productId is UUID
      const cart = await this.getOrCreateCart(userId);
  
      // Find product by UUID
      const product = await this.productRepo.findOne({ where: { productId: productId }, relations: ['variants'] });
      if (!product) throw new NotFoundException('Product not found');

      const variant = product.variants?.find(v => v.isDefault) || product.variants?.[0];
      if (!variant) throw new BadRequestException('Product has no variants');
    
      // Check stock from variant
      if (variant.quantity < quantity) {
        throw new BadRequestException('Not enough stock available');
      }
  
      let cartItem = cart.items.find((item) => item.product.id === product.id);
  
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
    async removeFromCart(userId: string, productId: string) { // productId is UUID
      const cart = await this.getOrCreateCart(userId);
  
      // Find product by UUID
      const product = await this.productRepo.findOne({ where: { productId: productId } });
      if (!product) throw new NotFoundException('Product not found');

      const cartItem = cart.items.find((item) => item.product.id === product.id);
      if (!cartItem) throw new NotFoundException('Product not in cart');
  
      await this.cartItemRepo.remove(cartItem);
      return this.getOrCreateCart(userId); // return updated cart
    }
  
    /** 📦 Get user cart */
    async getCart(userId: string, search?: string) {
      if (search && search.trim()) {
        return this.getCartWithSearch(userId, search);
      }
      return this.getOrCreateCart(userId);
    }

    /** ❌ Clear cart */
    async clearCart(userId: string) {
      const cart = await this.getOrCreateCart(userId);
      await this.cartItemRepo.remove(cart.items);
      cart.items = [];
      return this.cartRepo.save(cart);
    }
  }
  