import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../Auth/guards/jwt-auth.guard';
import { AdminGuard } from '../Auth/guards/admin.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
  ) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    const order = await this.orderService.create(createOrderDto, req.user.id);

    return {
      order,
      message: 'Order created successfully. Use /payments/create-intent to create payment.',
    };
  }

  @Get()
  findAll(@Request() req: any, @Query('admin') isAdmin?: string) {
    // If user is admin, return all orders, otherwise return user's orders
    const userId =
      isAdmin === 'true' && req.user.role === 'admin' ? undefined : req.user.id;
    return this.orderService.findAll(userId);
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  getStats() {
    return this.orderService.getOrderStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Get('track/:orderNumber')
  trackOrder(@Param('orderNumber') orderNumber: string) {
    return this.orderService.findByOrderNumber(orderNumber);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Delete(':id')
  cancel(@Param('id') id: string) {
    return this.orderService.cancel(id);
  }

  // Refund endpoint moved to PaymentController
}
