import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';
import { WishlistItem } from './Entities/wishlist-item.entity';
import { Product } from '../Product/Entities/product.entity';
import { User } from '../Users/Entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WishlistItem, Product, User]),
  ],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}

