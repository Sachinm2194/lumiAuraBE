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
import { ProductVariant } from '../Product/Entities/product-variant.entity';

  
  @Injectable()
  export class CartService {
    constructor(
      @InjectRepository(Cart) private cartRepo: Repository<Cart>,
      @InjectRepository(CartItem) private cartItemRepo: Repository<CartItem>,
      @InjectRepository(User) private userRepo: Repository<User>,
      @InjectRepository(Product) private productRepo: Repository<Product>,
      @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
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
    async addToCart(userId: string, productId: string, quantity: number, variantId?: number) {
      const cart = await this.getOrCreateCart(userId);
  
      // Find product by UUID
      const product = await this.productRepo.findOne({ 
        where: { productId: productId }, 
        relations: ['variants'] 
      });
      if (!product) throw new NotFoundException('Product not found');

      // Determine which variant to use
      let variant: ProductVariant;
      
      if (variantId) {
        // Use specified variant
        variant = await this.variantRepo.findOne({ where: { id: variantId, productId: product.id } });
        if (!variant) throw new NotFoundException('Variant not found for this product');
      } else {
        // Use default variant or first available
        variant = product.variants?.find(v => v.isDefault) || product.variants?.[0];
        if (!variant) throw new BadRequestException('Product has no variants');
      }
    
      // Check stock from variant
      if (variant.quantity < quantity) {
        throw new BadRequestException('Not enough stock available');
      }
  
      // Check if item with same product and variant already exists
      let cartItem = cart.items.find((item) => 
        item.product.id === product.id && 
        (!item.variant || !variantId || item.variant.id === variantId)
      );
  
      if (cartItem) {
        cartItem.quantity += quantity;
      } else {
        cartItem = this.cartItemRepo.create({ 
          cart, 
          product, 
          quantity,
          variant: variantId ? variant : undefined
        });
        cart.items.push(cartItem);
      }
  
      await this.cartRepo.save(cart);
      return cart;
    }
  
    /** 🗑 Remove product from cart */
    async removeFromCart(userId: string, productIds: string[]) { // productIds are UUIDs
      const cart = await this.getOrCreateCart(userId);
  
      // Find all products by their UUIDs
      const products = await this.productRepo.find({
        where: productIds.map(productId => ({ productId: productId }))
      });

      if (products.length === 0) throw new NotFoundException('No products found');

      // Find and remove matching cart items
      const productIds_set = new Set(products.map(p => p.id));
      const itemsToRemove = cart.items.filter((item) => productIds_set.has(item.product.id));

      if (itemsToRemove.length === 0) throw new NotFoundException('No products found in cart');
  
      await this.cartItemRepo.remove(itemsToRemove);
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

    /** ✏️ Update cart item quantity */
    async updateCartItem(userId: string, productId: string, quantity: number, variantId?: number) {
      const cart = await this.getOrCreateCart(userId);

      // Find product by UUID
      const product = await this.productRepo.findOne({ where: { productId: productId } });
      if (!product) throw new NotFoundException('Product not found');

      // Find the cart item
      let cartItem = cart.items.find((item) => 
        item.product.id === product.id && 
        (!item.variant || !variantId || item.variant.id === variantId)
      );

      if (!cartItem) throw new NotFoundException('Product not in cart');

      // Validate quantity
      if (quantity < 1) {
        throw new BadRequestException('Quantity must be at least 1');
      }

      // If variant is specified, validate stock
      if (variantId) {
        const variant = await this.variantRepo.findOne({ where: { id: variantId, productId: product.id } });
        if (!variant) throw new NotFoundException('Variant not found');
        if (variant.quantity < quantity) {
          throw new BadRequestException('Not enough stock available');
        }
      } else {
        // Validate against default variant
        const variant = product.variants?.find(v => v.isDefault) || product.variants?.[0];
        if (!variant) throw new BadRequestException('Product has no variants');
        if (variant.quantity < quantity) {
          throw new BadRequestException('Not enough stock available');
        }
      }

      // Update quantity
      cartItem.quantity = quantity;
      await this.cartRepo.save(cart);

      return this.getOrCreateCart(userId);
    }
  }
  