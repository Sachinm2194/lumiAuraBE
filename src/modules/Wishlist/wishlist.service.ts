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
    productId: string, // UUID
    notes?: string,
  ): Promise<WishlistItem[]> {
    const user = await this.userRepo.findOne({ where: { userId: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Find product by UUID
    const product = await this.productRepo.findOne({
      where: { productId: productId },
      relations: ['variants'],
    });
    if (!product) throw new NotFoundException('Product not found');

    // Check if product already in wishlist
    const existingItem = await this.wishlistItemRepo.findOne({
      where: {
        userId: user.id,
        product: { id: product.id },
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
    productId: string, // UUID
  ): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { userId: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Find product by UUID
    const product = await this.productRepo.findOne({
      where: { productId: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const wishlistItem = await this.wishlistItemRepo.findOne({
      where: {
        userId: user.id,
        product: { id: product.id },
      },
    });

    if (!wishlistItem) {
      throw new NotFoundException('Product not found in wishlist');
    }

    await this.wishlistItemRepo.remove(wishlistItem);

    return { message: 'Product removed from wishlist' };
  }

  /** 📦 Get user wishlist */
  async getWishlist(userId: string, search?: string): Promise<WishlistItem[]> {
    const user = await this.userRepo.findOne({ where: { userId: userId } });
    if (!user) throw new NotFoundException('User not found');

    const query = this.wishlistItemRepo
      .createQueryBuilder('wishlistItem')
      .leftJoinAndSelect('wishlistItem.product', 'product')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.images', 'images')
      .where('wishlistItem.userId = :userId', { userId: user.id });

    if (search && search.trim()) {
      query.andWhere(
        '(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search) OR LOWER(wishlistItem.notes) LIKE LOWER(:search))',
        { search: `%${search.trim()}%` }
      );
    }

    query.orderBy('wishlistItem.createdAt', 'DESC');

    return query.getMany();
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
    productId: string, // UUID
  ): Promise<{ isInWishlist: boolean }> {
    const user = await this.userRepo.findOne({ where: { userId: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Find product by UUID
    const product = await this.productRepo.findOne({
      where: { productId: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const item = await this.wishlistItemRepo.findOne({
      where: {
        userId: user.id,
        product: { id: product.id },
      },
    });

    return { isInWishlist: !!item };
  }
}

