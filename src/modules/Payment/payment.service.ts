import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { OrderService } from '../Order/order.service';
import { PaymentStatus } from '../Order/entities/order.entity';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => OrderService))
    private orderService: OrderService,
  ) {
    this.stripe = new Stripe(
      this.configService.get('STRIPE_SECRET_KEY') || '',
      {
        apiVersion: '2023-10-16',
      },
    );
  }

  async createPaymentIntent(
    orderId: string,
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const order = await this.orderService.findOne(orderId);

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(Number(order.total) * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Update order with payment intent ID
      await this.orderService.updatePaymentStatus(
        order.id,
        PaymentStatus.PENDING,
        paymentIntent.id,
      );

      return {
        clientSecret: paymentIntent.client_secret || '',
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create payment intent: ${error.message}`,
      );
    }
  }

  async handleWebhook(signature: string, payload: Buffer): Promise<void> {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET') || '';

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (error) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${error.message}`,
      );
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentSuccess(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;

    if (orderId) {
      await this.orderService.updatePaymentStatus(
        orderId,
        PaymentStatus.PAID,
        paymentIntent.id,
      );
    }
  }

  private async handlePaymentFailure(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;

    if (orderId) {
      await this.orderService.updatePaymentStatus(
        orderId,
        PaymentStatus.FAILED,
        paymentIntent.id,
      );
    }
  }

  async refundPayment(
    orderId: string,
    amount?: number,
  ): Promise<Stripe.Refund> {
    const order = await this.orderService.findOne(orderId);

    if (!order.paymentIntentId) {
      throw new BadRequestException('No payment found for this order');
    }

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: order.paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents or full refund
      });

      if (refund.status === 'succeeded') {
        await this.orderService.updatePaymentStatus(
          order.id,
          PaymentStatus.REFUNDED,
        );
      }

      return refund;
    } catch (error) {
      throw new BadRequestException(
        `Failed to process refund: ${error.message}`,
      );
    }
  }
}
