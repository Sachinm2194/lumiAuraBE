import {
  Controller,
  Post,
  Body,
  Headers,
  Request,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AdminGuard } from '../Auth/guards/admin.guard';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Request() req: RawBodyRequest<Request>,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException(
        'Raw body is required for webhook verification',
      );
    }
    await this.paymentService.handleWebhook(signature, req.rawBody);
    return { received: true };
  }

  @Post('create-intent')
  async createPaymentIntent(@Body('orderId') orderId: string) {
    return this.paymentService.createPaymentIntent(orderId);
  }

  @Post('refund/:orderId')
  @UseGuards(AdminGuard)
  async refund(
    @Param('orderId') orderId: string,
    @Body('amount') amount?: number,
  ) {
    const refund = await this.paymentService.refundPayment(orderId, amount);
    return { refund };
  }
}
