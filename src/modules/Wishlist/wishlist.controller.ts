import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import {
  AddToWishlistDto,
  RemoveFromWishlistDto,
} from './DTO';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  /** ➕ Add product to wishlist */
  @Post('add')
  addToWishlist(@Body() dto: AddToWishlistDto) {
    return this.wishlistService.addToWishlist(
      dto.userId,
      dto.productId,
      dto.notes,
    );
  }

  /** 🗑 Remove product from wishlist */
  @Delete('remove/:userId/:productId')
  removeFromWishlist(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.wishlistService.removeFromWishlist(userId, productId);
  }

  /** 📦 Get user wishlist */
  @Get(':userId')
  getWishlist(@Param('userId', ParseIntPipe) userId: number) {
    return this.wishlistService.getWishlist(userId);
  }

  /** ❌ Clear wishlist */
  @Delete('clear/:userId')
  clearWishlist(@Param('userId', ParseIntPipe) userId: number) {
    return this.wishlistService.clearWishlist(userId);
  }

  /** ✅ Check if product is in wishlist */
  @Get('check/:userId/:productId')
  checkInWishlist(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.wishlistService.isInWishlist(userId, productId);
  }
}

