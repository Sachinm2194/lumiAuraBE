import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OrderService } from './order.service';
import { OrderStatus } from './entities/order.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<number, string[]>(); // userId -> socketIds[]

  constructor(private orderService: OrderService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Remove socket from user mapping
    for (const [userId, socketIds] of this.userSockets.entries()) {
      const index = socketIds.indexOf(client.id);
      if (index > -1) {
        socketIds.splice(index, 1);
        if (socketIds.length === 0) {
          this.userSockets.delete(userId);
        }
        break;
      }
    }
  }

  @SubscribeMessage('join-user-room')
  handleJoinUserRoom(
    @MessageBody() data: { userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;
    
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }
    
    this.userSockets.get(userId)?.push(client.id);
    client.join(`user-${userId}`);
    
    console.log(`User ${userId} joined room with socket ${client.id}`);
  }

  @SubscribeMessage('track-order')
  async handleTrackOrder(
    @MessageBody() data: { orderNumber: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const order = await this.orderService.findByOrderNumber(data.orderNumber);
      client.emit('order-status', {
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber,
        estimatedDelivery: order.estimatedDelivery,
        updatedAt: order.updatedAt,
      });
    } catch (error) {
      client.emit('order-error', { message: 'Order not found' });
    }
  }

  // Method to notify users about order updates
  async notifyOrderUpdate(orderId: string) {
    try {
      const order = await this.orderService.findOne(orderId);
      
      // Notify the specific user
      this.server.to(`user-${order.userId}`).emit('order-update', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber,
        estimatedDelivery: order.estimatedDelivery,
        updatedAt: order.updatedAt,
      });

      // Notify admin dashboard
      this.server.to('admin-room').emit('admin-order-update', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        userId: order.userId,
        total: order.total,
        updatedAt: order.updatedAt,
      });
    } catch (error) {
      console.error('Error notifying order update:', error);
    }
  }

  @SubscribeMessage('join-admin-room')
  handleJoinAdminRoom(@ConnectedSocket() client: Socket) {
    client.join('admin-room');
    console.log(`Admin joined room with socket ${client.id}`);
  }
}