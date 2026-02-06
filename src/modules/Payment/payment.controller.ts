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
import { JwtAuthGuard } from '../Auth/guards/jwt-auth.guard';
import { DummyPaymentDto } from './dto/dummy-payment.dto';

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

  @Post('dummy-payment')
  @UseGuards(JwtAuthGuard)
  async createDummyPayment(
    @Body() dummyPaymentDto: DummyPaymentDto,
    @Request() req: any,
  ) {
    // Use authenticated user's email if not provided in payload
    const email = dummyPaymentDto.email || req.user.email;
    
    if (!email) {
      throw new BadRequestException('Email is required. Please provide email in payload or ensure you are authenticated.');
    }

    return this.paymentService.createDummyPayment({
      ...dummyPaymentDto,
      email,
    });
  }
}
