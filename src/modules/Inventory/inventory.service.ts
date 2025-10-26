import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../Product/Entities/product.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async checkStock(productId: number, quantity: number): Promise<boolean> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new BadRequestException(`Product with ID ${productId} not found`);
    }

    return product.quantity >= quantity;
  }

  async reserveStock(productId: number, quantity: number): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new BadRequestException(`Product with ID ${productId} not found`);
    }

    if (product.quantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock for product ${product.name}. Available: ${product.quantity}, Requested: ${quantity}`,
      );
    }

    await this.productRepository.decrement({ id: productId }, 'quantity', quantity);
  }

  async releaseStock(productId: number, quantity: number): Promise<void> {
    await this.productRepository.increment({ id: productId }, 'quantity', quantity);
  }

  async updateStock(productId: number, newQuantity: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new BadRequestException(`Product with ID ${productId} not found`);
    }

    product.quantity = newQuantity;
    return this.productRepository.save(product);
  }

  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.quantity <= :threshold', { threshold })
      .getMany();
  }

  async getInventoryReport(): Promise<any> {
    const totalProducts = await this.productRepository.count();
    const lowStockProducts = await this.getLowStockProducts();
    const outOfStockProducts = await this.productRepository.count({
      where: { quantity: 0 },
    });

    const totalValue = await this.productRepository
      .createQueryBuilder('product')
      .select('SUM(product.price * product.quantity)', 'total')
      .getRawOne();

    return {
      totalProducts,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts,
      totalInventoryValue: Number(totalValue.total) || 0,
      lowStockProducts,
    };
  }
}