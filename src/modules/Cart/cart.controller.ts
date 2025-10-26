// src/modules/cart/cart.controller.ts
import {
    Controller,
    Post,
    Delete,
    Get,
    Param,
    Body,
    ParseIntPipe,
  } from '@nestjs/common';
  import { CartService } from './cart.service';
  import { 
    AddToCartDto, 
    RemoveFromCartDto, 
    ClearCartDto, 
    GetCartDto 
  } from './DTO';
  
  @Controller('cart')
  export class CartController {
    constructor(private readonly cartService: CartService) {}
  
    /** ➕ Add product to cart */
    @Post('add')
    addToCart(@Body() dto: AddToCartDto) {
      return this.cartService.addToCart(dto.userId, dto.productId, dto.quantity);
    }
  
    /** 🗑 Remove product from cart */
    @Delete('remove/:userId/:productId')
    removeFromCart( 
      @Param('userId', ParseIntPipe) userId: number,
      @Param('productId', ParseIntPipe) productId: number,
    ) {
      return this.cartService.removeFromCart(userId, productId);
    }
  
    /** 📦 Get user cart */
    @Get(':userId')
    getCart(@Param('userId', ParseIntPipe) userId: number) {
      return this.cartService.getCart(userId);
    }
  
    /** ❌ Clear cart */
    @Delete('clear/:userId')
    clearCart(@Param('userId', ParseIntPipe) userId: number) {
      return this.cartService.clearCart(userId);
    }
  }
  