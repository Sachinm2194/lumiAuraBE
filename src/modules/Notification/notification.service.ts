import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Order, OrderStatus } from '../Order/entities/order.entity';

@Injectable()
export class NotificationService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendOrderConfirmation(order: Order): Promise<void> {
    const mailOptions = {
      from: this.configService.get('FROM_EMAIL'),
      to: order.user.email,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: this.generateOrderConfirmationEmail(order),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(
        `Order confirmation email sent for order ${order.orderNumber}`,
      );
    } catch (error) {
      console.error('Failed to send order confirmation email:', error);
    }
  }

  async sendOrderStatusUpdate(order: Order): Promise<void> {
    const mailOptions = {
      from: this.configService.get('FROM_EMAIL'),
      to: order.user.email,
      subject: `Order Update - ${order.orderNumber}`,
      html: this.generateOrderStatusEmail(order),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Order status email sent for order ${order.orderNumber}`);
    } catch (error) {
      console.error('Failed to send order status email:', error);
    }
  }

  private generateOrderConfirmationEmail(order: Order): string {
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td>${item.productName}</td>
          <td>${item.quantity}</td>
          <td>$${item.price}</td>
          <td>$${item.total}</td>
        </tr>
      `,
      )
      .join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Order Confirmation</h1>
        <p>Thank you for your order! Here are the details:</p>
        
        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
          <h2>Order #${order.orderNumber}</h2>
          <p><strong>Order Date:</strong> ${order.createdAt.toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${order.status}</p>
        </div>

        <h3>Items Ordered:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: left;">Quantity</th>
              <th style="padding: 10px; text-align: left;">Price</th>
              <th style="padding: 10px; text-align: left;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-top: 20px; text-align: right;">
          <p><strong>Subtotal: $${order.subtotal}</strong></p>
          <p><strong>Tax: $${order.tax}</strong></p>
          <p><strong>Shipping: $${order.shipping}</strong></p>
          <h3><strong>Total: $${order.total}</strong></h3>
        </div>

        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
          <h3>Shipping Address:</h3>
          <p>
            ${order.shippingAddress.fullName}<br>
            ${order.shippingAddress.addressLine1}<br>
            ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br>
            ${order.shippingAddress.country}
          </p>
        </div>

        <p>We'll send you another email when your order ships!</p>
        <p>Thank you for shopping with LumiAura!</p>
      </div>
    `;
  }

  private generateOrderStatusEmail(order: Order): string {
    let statusMessage = '';

    switch (order.status) {
      case OrderStatus.CONFIRMED:
        statusMessage = 'Your order has been confirmed and is being prepared.';
        break;
      case OrderStatus.PROCESSING:
        statusMessage = 'Your order is currently being processed.';
        break;
      case OrderStatus.SHIPPED:
        statusMessage = `Your order has been shipped! ${order.trackingNumber ? `Tracking number: ${order.trackingNumber}` : ''}`;
        break;
      case OrderStatus.DELIVERED:
        statusMessage =
          'Your order has been delivered! We hope you love your purchase.';
        break;
      case OrderStatus.CANCELLED:
        statusMessage = 'Your order has been cancelled.';
        break;
      default:
        statusMessage = `Your order status has been updated to: ${order.status}`;
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Order Update</h1>
        
        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
          <h2>Order #${order.orderNumber}</h2>
          <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
          ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
          ${order.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${order.estimatedDelivery.toLocaleDateString()}</p>` : ''}
        </div>

        <p>${statusMessage}</p>

        <p>You can track your order anytime by visiting our website and entering your order number.</p>
        <p>Thank you for shopping with LumiAura!</p>
      </div>
    `;
  }
}
