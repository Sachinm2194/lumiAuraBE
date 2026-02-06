// src/modules/Order/order.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../Product/Entities/product.entity';
import { ProductVariant } from '../Product/Entities/product-variant.entity';
import { User } from '../Users/Entities/user.entity';
import { Address } from '../Address/Entities/address.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: string): Promise<Order> {
    // Find user by UUID
    const user = await this.userRepository.findOne({ where: { userId: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const {
      items,
      shippingAddressId,
      shippingAddress,
      billingAddressId,
      billingAddress,
      notes,
    } = createOrderDto;

    // Validate that either addressId or manual address is provided
    if (!shippingAddressId && !shippingAddress) {
      throw new BadRequestException(
        'Either shippingAddressId or shippingAddress must be provided',
      );
    }

    // Handle shipping address - use saved address if provided, otherwise use manual entry
    let finalShippingAddress: any;
    let finalShippingAddressId: string | null = null;

    if (shippingAddressId) {
      // Fetch saved address
      const savedShippingAddress = await this.addressRepository.findOne({
        where: { addressId: shippingAddressId, userId: user.id },
      });
      if (!savedShippingAddress) {
        throw new NotFoundException(
          `Shipping address with ID ${shippingAddressId} not found for this user`,
        );
      }
      // Convert saved address to JSON format for snapshot
      finalShippingAddress = {
        fullName: savedShippingAddress.fullName,
        addressLine1: savedShippingAddress.addressLine1,
        addressLine2: savedShippingAddress.addressLine2,
        city: savedShippingAddress.city,
        state: savedShippingAddress.state,
        postalCode: savedShippingAddress.postalCode,
        country: savedShippingAddress.country,
        phone: savedShippingAddress.phone,
      };
      finalShippingAddressId = savedShippingAddress.addressId;
    } else {
      // Use manual address entry
      finalShippingAddress = shippingAddress;
    }

    // Handle billing address - use saved address if provided, otherwise use manual entry or shipping address
    let finalBillingAddress: any;
    let finalBillingAddressId: string | null = null;

    if (billingAddressId) {
      // Fetch saved address
      const savedBillingAddress = await this.addressRepository.findOne({
        where: { addressId: billingAddressId, userId: user.id },
      });
      if (!savedBillingAddress) {
        throw new NotFoundException(
          `Billing address with ID ${billingAddressId} not found for this user`,
        );
      }
      // Convert saved address to JSON format for snapshot
      finalBillingAddress = {
        fullName: savedBillingAddress.fullName,
        addressLine1: savedBillingAddress.addressLine1,
        addressLine2: savedBillingAddress.addressLine2,
        city: savedBillingAddress.city,
        state: savedBillingAddress.state,
        postalCode: savedBillingAddress.postalCode,
        country: savedBillingAddress.country,
      };
      finalBillingAddressId = savedBillingAddress.addressId;
    } else if (billingAddress) {
      // Use manual billing address entry
      finalBillingAddress = billingAddress;
    } else {
      // Default to shipping address
      finalBillingAddress = finalShippingAddress;
    }

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems: Partial<OrderItem>[] = [];

    for (const item of items) {
      // Load product with variants by UUID productId
      const product = await this.productRepository.findOne({
        where: { productId: item.productId },
        relations: ['variants', 'images'],
      });

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.productId} not found`,
        );
      }

      if (!product.variants || product.variants.length === 0) {
        throw new BadRequestException(
          `Product ${product.name} has no variants available`,
        );
      }

      // Find variant - use variantId from item if provided, otherwise use default or first variant
      let variant: ProductVariant;
      if (item.variantId) {
        variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          throw new NotFoundException(
            `Variant with ID ${item.variantId} not found for product ${product.name}`,
          );
        }
      } else {
        // Use default variant or first variant
        variant = product.variants.find((v) => v.isDefault) || product.variants[0];
      }

      // Check stock from variant
      if (variant.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name} - ${variant.variantName}. Available: ${variant.quantity}, Requested: ${item.quantity}`,
        );
      }

      // Use variant price
      const itemTotal = Number(variant.sellingPrice) * item.quantity;
      subtotal += itemTotal;

      // Get primary image
      const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];

      orderItems.push({
        productId: product.id,
        variantId: variant.id,
        quantity: item.quantity,
        price: variant.sellingPrice,
        total: itemTotal,
        productName: product.name,
        productImage: primaryImage?.imageUrl || undefined,
        productVariant: {
          variantId: variant.id,
          variantName: variant.variantName,
          sku: variant.sku,
          ...item.productVariant, // Include any additional variant data from DTO
        },
      });
    }

    // Calculate tax and shipping (you can customize these calculations)
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 1000 ? 0 : 50; // Free shipping over ₹1000
    const total = subtotal + tax + shipping;

    // Generate order number
    const orderNumber = this.generateOrderNumber();

    // Create order
    const order = this.orderRepository.create({
      orderNumber,
      userId: user.id, // Use integer ID for foreign key
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      shipping: Number(shipping.toFixed(2)),
      total: Number(total.toFixed(2)),
      shippingAddressId: finalShippingAddressId,
      billingAddressId: finalBillingAddressId,
      shippingAddress: finalShippingAddress, // JSON snapshot
      billingAddress: finalBillingAddress, // JSON snapshot
      notes,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Create order items and update inventory
    for (const itemData of orderItems) {
      const orderItem = this.orderItemRepository.create({
        ...itemData,
        orderId: savedOrder.id,
      });
      await this.orderItemRepository.save(orderItem);

      // Update variant inventory
      if (itemData.variantId && itemData.quantity) {
        await this.variantRepository.decrement(
          { id: itemData.variantId },
          'quantity',
          itemData.quantity,
        );
      }
    }

    return this.findOne(savedOrder.id);
  }

  async findAll(userId?: string): Promise<Order[]> {
    let where: any = {};
    if (userId) {
      // Find user by UUID, then use integer ID for query
      const user = await this.userRepository.findOne({ where: { userId: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      where = { userId: user.id };
    }
    return this.orderRepository.find({
      where,
      relations: ['user', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['user', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order with number ${orderNumber} not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    Object.assign(order, updateOrderDto);

    if (updateOrderDto.status === OrderStatus.DELIVERED && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    await this.orderRepository.save(order);
    return this.findOne(id);
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatus,
    paymentIntentId?: string,
  ): Promise<Order> {
    const order = await this.findOne(id);

    order.paymentStatus = paymentStatus;
    if (paymentIntentId) {
      order.paymentIntentId = paymentIntentId;
    }

    if (paymentStatus === PaymentStatus.PAID) {
      order.status = OrderStatus.CONFIRMED;
    }

    await this.orderRepository.save(order);
    return this.findOne(id);
  }

  async cancel(id: string): Promise<Order> {
    const order = await this.findOne(id);

    if (
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Cannot cancel shipped or delivered orders',
      );
    }

    // Restore variant inventory
    for (const item of order.items) {
      if (item.variantId && item.quantity) {
        await this.variantRepository.increment(
          { id: item.variantId },
          'quantity',
          item.quantity,
        );
      }
    }

    order.status = OrderStatus.CANCELLED;
    await this.orderRepository.save(order);

    return this.findOne(id);
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `ORD-${timestamp.slice(-6)}${random}`;
  }

  async getOrderStats(): Promise<any> {
    const totalOrders = await this.orderRepository.count();
    const pendingOrders = await this.orderRepository.count({
      where: { status: OrderStatus.PENDING },
    });
    const completedOrders = await this.orderRepository.count({
      where: { status: OrderStatus.DELIVERED },
    });

    const totalRevenue = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.paymentStatus = :status', { status: PaymentStatus.PAID })
      .getRawOne();

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue: Number(totalRevenue.total) || 0,
    };
  }
}