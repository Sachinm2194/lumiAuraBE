import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Order, OrderStatus } from '../Order/entities/order.entity';

@Injectable()
export class NotificationService {
  private transporter: nodemailer.Transporter | null = null;
  private isSmtpConfigured: boolean = false;

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get('SMTP_HOST');
    const smtpPort = this.configService.get('SMTP_PORT');
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPass = this.configService.get('SMTP_PASS');

    // Only create transporter if SMTP is fully configured
    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      try {
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort.toString(), 10),
          secure: false,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
        this.isSmtpConfigured = true;
        console.log('✅ SMTP configured successfully');
      } catch (error) {
        console.warn('⚠️  Failed to initialize SMTP transporter:', error);
        this.isSmtpConfigured = false;
      }
    } else {
      console.warn('⚠️  SMTP not configured. Email sending will be disabled.');
      console.warn('   Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in your .env file');
      this.isSmtpConfigured = false;
    }
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

  async sendVerificationEmail(email: string, verificationToken: string, firstName?: string): Promise<void> {
    // Check if SMTP is configured
    if (!this.isSmtpConfigured || !this.transporter) {
      const apiUrl = `http://localhost:9000/auth/verify-email?token=${verificationToken}`;
      console.warn(`⚠️  SMTP not configured. Email not sent to ${email}`);
      console.warn(`📧 [DEV MODE] Verification URL: ${apiUrl}`);
      console.warn(`📧 [DEV MODE] Token: ${verificationToken}`);
      // Don't throw error - just log the token for development
      return;
    }

    const verificationUrl = `${this.configService.get('FRONTEND_URL') || 'http://localhost:3001'}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: this.configService.get('FROM_EMAIL') || 'noreply@lumiaura.com',
      to: email,
      subject: 'Verify Your Email - LumiAura',
      html: this.generateVerificationEmail(firstName || 'User', verificationUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      // In development, still log the token even if email fails
      if (process.env.NODE_ENV !== 'production') {
        const apiUrl = `http://localhost:9000/auth/verify-email?token=${verificationToken}`;
        console.warn(`📧 [DEV MODE] Verification URL: ${apiUrl}`);
        console.warn(`📧 [DEV MODE] Token: ${verificationToken}`);
      }
      throw error;
    }
  }

  private generateVerificationEmail(name: string, verificationUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center;">Welcome to LumiAura!</h1>
        
        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <p style="font-size: 16px;">Hi ${name},</p>
          <p style="font-size: 16px;">Thank you for registering with LumiAura! Please verify your email address to complete your registration.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #4CAF50; 
                    color: white; 
                    padding: 14px 28px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    display: inline-block; 
                    font-size: 16px; 
                    font-weight: bold;">
            Verify Email Address
          </a>
        </div>

        <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
          <p style="margin: 0; font-size: 14px; color: #856404;">
            <strong>Note:</strong> If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #856404; word-break: break-all;">${verificationUrl}</a>
          </p>
        </div>

        <p style="font-size: 14px; color: #666;">
          This verification link will expire in 24 hours. If you didn't create an account with LumiAura, please ignore this email.
        </p>

        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Best regards,<br>
          The LumiAura Team
        </p>
      </div>
    `;
  }
}
