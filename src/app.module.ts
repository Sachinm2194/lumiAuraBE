import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/Users/users.module';
import { AuthModule } from './modules/Auth/auth.module';
import { ProductModule } from './modules/Product/product.module';
import { CartModule } from './modules/Cart/cart.module';
import { OrderModule } from './modules/Order/order.module';
import { PaymentModule } from './modules/Payment/payment.module';
import { InventoryModule } from './modules/Inventory/inventory.module';
import { NotificationModule } from './modules/Notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // makes ConfigService available globally
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        ssl: {
          // require: true, // <-- ensure SSL is required
          rejectUnauthorized: false, // <-- Render uses self-signed certs
        },
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    UsersModule,
    AuthModule,
    ProductModule,
    CartModule,
    OrderModule,
    PaymentModule,
    InventoryModule,
    NotificationModule,
  ],
})
export class AppModule {}
