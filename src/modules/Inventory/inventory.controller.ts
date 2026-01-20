import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdminGuard } from '../Auth/guards/admin.guard';

// src/modules/Inventory/inventory.controller.ts
// ... existing imports ...

@Controller('inventory')
@UseGuards(AdminGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('report')
  getInventoryReport() {
    return this.inventoryService.getInventoryReport();
  }

  @Get('low-stock')
  getLowStockProducts(@Query('threshold') threshold?: number) {
    return this.inventoryService.getLowStockProducts(threshold ? Number(threshold) : 10);
  }

  @Patch(':productId/stock')
  updateStock(
    @Param('productId') productId: number,
    @Body('quantity') quantity: number,
  ) {
    // Updated to use updateProductStock (works with default variant)
    return this.inventoryService.updateProductStock(productId, quantity);
  }
}