// src/modules/cart/cart.controller.ts
import {
    Controller,
    Post,
    Delete,
    Get,
    Param,
    Body,
    Req,
    UseGuards,
    Query,
  } from '@nestjs/common';
  import { CartService } from './cart.service';
  import { AddToCartDto } from './DTO';
  import { JwtAuthGuard } from '../Auth/guards/jwt-auth.guard';
  
  @Controller('cart')
  @UseGuards(JwtAuthGuard)
  export class CartController {
    constructor(private readonly cartService: CartService) {}
  
    /** ➕ Add product to cart */
    @Post('add')
    addToCart(@Body() dto: AddToCartDto, @Req() req) {
      const userId = req.user.userId;
      return this.cartService.addToCart(userId, dto.productId, dto.quantity, dto.variantId);
    }
  
    /** 🗑 Remove product from cart */
    @Delete('remove/:productId')
    removeFromCart( 
      @Param('productId') productId: string, // UUID string
      @Req() req,
    ) {
      const userId = req.user.userId;
      return this.cartService.removeFromCart(userId, productId);
    }
  
    /** 📦 Get user cart */
    @Get()
    getCart(@Req() req, @Query('search') search?: string) {
      const userId = req.user.userId;
      return this.cartService.getCart(userId, search);
    }
  
    /** ❌ Clear cart */
    @Delete('clear')
    clearCart(@Req() req) {
      const userId = req.user.userId;
      return this.cartService.clearCart(userId);
    }
  }
  