import { Module, forwardRef } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { OrderModule } from '../Order/order.module';
import { AuthModule } from '../Auth/auth.module';
import { NotificationModule } from '../Notification/notification.module';

@Module({
  imports: [
    forwardRef(() => OrderModule),
    AuthModule,
    NotificationModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}