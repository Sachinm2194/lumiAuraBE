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
      @Param('productId', ParseIntPipe) productId: number,
      @Request() req: any,
      @Body() body: CreateReviewDto,
    ) {
      return this.reviewService.create(
        productId,
        req.user.id,
        body.rating,
        body.comment || undefined,
      );
    }
  
    @Get()
    findByProduct(@Param('productId', ParseIntPipe) productId: number) {
      return this.reviewService.findByProduct(productId);
    }
  
    @Get('stats')
    getRatingStats(@Param('productId', ParseIntPipe) productId: number) {
      return this.reviewService.getProductRatingStats(productId);
    }
  
    @Get('my-reviews')
    @UseGuards(JwtAuthGuard)
    findByUser(@Request() req: any) {
      return this.reviewService.findByUser(req.user.id);
    }
  
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(
      @Param('id', ParseIntPipe) id: number,
      @Request() req: any,
      @Body() body: UpdateReviewDto,
    ) {
      // Optional: Add check to ensure user owns the review
      return this.reviewService.update(id, body.rating, body.comment);
    }
  
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id', ParseIntPipe) id: number) {
      return this.reviewService.remove(id);
    }
  } 