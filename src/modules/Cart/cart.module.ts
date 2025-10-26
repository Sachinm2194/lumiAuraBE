import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './Entities/cart.entity';
import { CartItem } from './Entities/cart-item.entity';
import { User } from '../Users/Entities/user.entity';
import { Product } from '../Product/Entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem,User,Product])],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService ],
})
export class CartModule {}
