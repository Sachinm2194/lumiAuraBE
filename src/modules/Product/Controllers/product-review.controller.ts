// src/modules/Product/Controllers/product-review.controller.ts
import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    ParseIntPipe,
    UseGuards,
    Request,
  } from '@nestjs/common';
  import { ProductReviewService } from '../Services/product-review.service';
  import { JwtAuthGuard } from '../../Auth/guards/jwt-auth.guard';
  import { CreateReviewDto, UpdateReviewDto } from '../DTO/create-review.dto';
  
  @Controller('products/:productId/reviews')
  export class ProductReviewController {
    constructor(
      private readonly reviewService: ProductReviewService,
    ) {}
  
    @Post()
    @UseGuards(JwtAuthGuard)
    create(
      @Param('productId') productId: string, // UUID string
      @Request() req: any,
      @Body() body: CreateReviewDto,
    ) {
      const userId = req.user.userId; // Get UUID from JWT
      return this.reviewService.create(
        productId,
        userId,
        body.rating,
        body.comment || undefined,
      );
    }

    @Get()
    findByProduct(@Param('productId') productId: string) { // UUID string
      return this.reviewService.findByProduct(productId);
    }

    @Get('stats')
    getRatingStats(@Param('productId') productId: string) { // UUID string
      return this.reviewService.getProductRatingStats(productId);
    }

    @Get('my-reviews')
    @UseGuards(JwtAuthGuard)
    findByUser(@Request() req: any) {
      const userId = req.user.userId; // Get UUID from JWT
      return this.reviewService.findByUser(userId);
    }
  
    @Patch(':reviewId')
    @UseGuards(JwtAuthGuard)
    update(
      @Param('reviewId') reviewId: string, // UUID string
      @Request() req: any,
      @Body() body: UpdateReviewDto,
    ) {
      // Optional: Add check to ensure user owns the review
      return this.reviewService.update(reviewId, body.rating, body.comment);
    }
  
    @Delete(':reviewId')
    @UseGuards(JwtAuthGuard)
    remove(@Param('reviewId') reviewId: string) { // UUID string
      return this.reviewService.remove(reviewId);
    }
  } 