import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './Entities/wishlist-item.entity';
import { Product } from '../Product/Entities/product.entity';
import { User } from '../Users/Entities/user.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private wishlistItemRepo: Repository<WishlistItem>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /** ➕ Add product to wishlist */
  async addToWishlist(
    userId: string,
    productId: number,
    notes?: string,
  ): Promise<WishlistItem[]> {
    const user = await this.userRepo.findOne({ where: { userId: userId } });
    if (!user) throw new NotFoundException('User not found');

    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['variants'],
    });
    if (!product) throw new NotFoundException('Product not found');

    // Check if product already in wishlist
    const existingItem = await this.wishlistItemRepo.findOne({
      where: {
        userId: user.id,
        product: { id: productId },
      },
    });

    if (existingItem) {
      throw new BadRequestException('Product already in wishlist');
    }

    const wishlistItem = this.wishlistItemRepo.create({
      user,
      userId: user.id,
      product,
      notes,
    });

    await this.wishlistItemRepo.save(wishlistItem);

    return this.getWishlist(userId);
  }

  /** 🗑 Remove product from wishlist */
  async removeFromWishlist(
    userId: string,
    productId: number,
  ): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { userId: userId } });
    if (!user) throw new NotFoundException('User not found');

    const wishlistItem = await this.wishlistItemRepo.findOne({
      where: {
        userId: user.id,
        product: { id: productId },
      },
    });

    if (!wishlistItem) {
      throw new NotFoundException('Product not found in wishlist');
    }

    await this.wishlistItemRepo.remove(wishlistItem);

    return { message: 'Product removed from wishlist' };
  }

  /** 📦 Get user wishlist */
  async getWishlist(userId: string): Promise<WishlistItem[]> {
    const user = await this.userRepo.findOne({ where: { userId: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.wishlistItemRepo.find({
      where: { userId: user.id },
      relations: ['product', 'product.variants', 'product.images'],
      order: { createdAt: 'DESC' },
    });
  }

  /** ❌ Clear wishlist */
  async clearWishlist(userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { userId: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.wishlistItemRepo.delete({ userId: user.id });
    return { message: 'Wishlist cleared' };
  }

  /** ✅ Check if product is in wishlist */
  async isInWishlist(
    userId: string,
    productId: number,
  ): Promise<{ isInWishlist: boolean }> {
    const user = await this.userRepo.findOne({ where: { userId: userId } });
    if (!user) throw new NotFoundException('User not found');

    const item = await this.wishlistItemRepo.findOne({
      where: {
        userId: user.id,
        product: { id: productId },
      },
    });

    return { isInWishlist: !!item };
  }
}

