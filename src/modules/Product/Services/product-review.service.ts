// src/modules/Product/Services/product-review.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductReview } from '../Entities/product-review.entity';
import { Product } from '../Entities/product.entity';

@Injectable()
export class ProductReviewService {
  constructor(
    @InjectRepository(ProductReview)
    private reviewRepo: Repository<ProductReview>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async create(
    productId: number,
    userId: number,
    rating: number,
    comment?: string,
    isVerifiedPurchase = false,
  ): Promise<ProductReview> {
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Check if product exists
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const review = this.reviewRepo.create({
      productId,
      userId,
      rating,
      comment,
      isVerifiedPurchase,
    });

    const savedReview = await this.reviewRepo.save(review);

    // Update product average rating and review count
    await this.updateProductRating(productId);

    return savedReview;
  }

  async findByProduct(productId: number): Promise<ProductReview[]> {
    return this.reviewRepo.find({
      where: { productId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: number): Promise<ProductReview[]> {
    return this.reviewRepo.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<ProductReview> {
    const review = await this.reviewRepo.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async update(
    id: number,
    rating?: number,
    comment?: string,
  ): Promise<ProductReview> {
    const review = await this.findOne(id);

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        throw new BadRequestException('Rating must be between 1 and 5');
      }
      review.rating = rating;
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    const updatedReview = await this.reviewRepo.save(review);

    // Update product rating after review update
    await this.updateProductRating(review.productId);

    return updatedReview;
  }

  async remove(id: number): Promise<void> {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const productId = review.productId;
    await this.reviewRepo.remove(review);

    // Update product rating after deletion
    await this.updateProductRating(productId);
  }

  async updateProductRating(productId: number): Promise<void> {
    const reviews = await this.reviewRepo.find({
      where: { productId, isActive: true },
    });

    if (reviews.length === 0) {
      await this.productRepo.update(productId, {
        averageRating: 0,
        reviewCount: 0,
      });
      return;
    }

    const totalRating = reviews.reduce(
      (sum, review) => sum + review.rating,
      0,
    );
    const averageRating = totalRating / reviews.length;

    await this.productRepo.update(productId, {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      reviewCount: reviews.length,
    });
  }

  async getProductRatingStats(productId: number) {
    const reviews = await this.reviewRepo.find({
      where: { productId, isActive: true },
    });

    const ratingCounts = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach((review) => {
      ratingCounts[review.rating as keyof typeof ratingCounts]++;
    });

    return {
      totalReviews: reviews.length,
      averageRating:
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0,
      ratingDistribution: ratingCounts,
    };
  }
}