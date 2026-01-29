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
import { WishlistService } from './wishlist.service';
import {
  AddToWishlistDto,
} from './DTO';
import { JwtAuthGuard } from '../Auth/guards/jwt-auth.guard';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  /** ➕ Add product to wishlist */
  @Post('add')
  addToWishlist(@Body() dto: AddToWishlistDto, @Req() req) {
    const userId = req.user.userId;
    return this.wishlistService.addToWishlist(
      userId,
      dto.productId,
      dto.notes,
    );
  }

  /** 🗑 Remove product from wishlist */
  @Delete('remove/:productId')
  removeFromWishlist(
    @Param('productId') productId: string, // UUID string
    @Req() req,
  ) {
    const userId = req.user.userId;
    return this.wishlistService.removeFromWishlist(userId, productId);
  }

  /** 📦 Get user wishlist */
  @Get()
  getWishlist(@Req() req , @Query('search') search:string) {
    const userId = req.user.userId;
    return this.wishlistService.getWishlist(userId, search,
    );
  }

  /** ❌ Clear wishlist */
  @Delete('clear')
  clearWishlist(@Req() req) {
    const userId = req.user.userId;
    return this.wishlistService.clearWishlist(userId);
  }

  /** ✅ Check if product is in wishlist */
  @Get('check/:productId')
  checkInWishlist(
    @Param('productId') productId: string, // UUID string
    @Req() req,
  ) {
    const userId = req.user.userId;
    return this.wishlistService.isInWishlist(userId, productId);
  }
}

