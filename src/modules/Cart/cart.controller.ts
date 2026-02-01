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
    Patch,
  } from '@nestjs/common';
  import { CartService } from './cart.service';
  import { AddToCartDto, RemoveFromCartDto } from './DTO';
  import { UpdateCartItemDto } from './DTO/update-cart-item.dto';
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

    /** ✏️ Update cart item quantity */
    @Post('update/:productId')
    updateCartItem(
      @Param('productId') productId: string,
      @Body() dto: UpdateCartItemDto,
      @Req() req
    ) {
      const userId = req.user.userId;
      return this.cartService.updateCartItem(userId, productId, dto.quantity, dto.variantId);
    }
  
    /** 🗑 Remove multiple products from cart */
    @Post('remove')
    removeFromCart(
      @Body() dto: RemoveFromCartDto,
      @Req() req,
    ) {
      const userId = req.user.userId;
      return this.cartService.removeFromCart(userId, dto.productIds);
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
  