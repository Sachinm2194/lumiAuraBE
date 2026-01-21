import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderGateway } from './order.gateway';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../Product/Entities/product.entity';
import { User } from '../Users/Entities/user.entity';
import { AuthModule } from '../Auth/auth.module';
import { NotificationModule } from '../Notification/notification.module';
import { ProductVariant } from '../Product/Entities/product-variant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product, ProductVariant, User]),
    AuthModule,
    NotificationModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderGateway],
  exports: [OrderService],
})
export class OrderModule {}