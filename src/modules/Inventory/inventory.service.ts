// src/modules/Inventory/inventory.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../Product/Entities/product.entity';
import { ProductVariant } from '../Product/Entities/product-variant.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
  ) {}

  /**
   * Check stock for a specific variant
   */
  async checkStock(variantId: number, quantity: number): Promise<boolean> {
    const variant = await this.variantRepository.findOne({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${variantId} not found`);
    }

    return variant.quantity >= quantity;
  }

  /**
   * Check stock for a product (uses default variant or first variant)
   */
  async checkProductStock(productId: number, quantity: number): Promise<boolean> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['variants'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (!product.variants || product.variants.length === 0) {
      throw new BadRequestException(`Product ${product.name} has no variants`);
    }

    // Use default variant or first variant
    const variant = product.variants.find((v) => v.isDefault) || product.variants[0];
    return variant.quantity >= quantity;
  }

  /**
   * Reserve stock for a specific variant
   */
  async reserveStock(variantId: number, quantity: number): Promise<void> {
    const variant = await this.variantRepository.findOne({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${variantId} not found`);
    }

    if (variant.quantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock for variant ${variant.variantName}. Available: ${variant.quantity}, Requested: ${quantity}`,
      );
    }

    await this.variantRepository.decrement({ id: variantId }, 'quantity', quantity);
  }

  /**
   * Reserve stock for a product (uses default variant)
   */
  async reserveProductStock(productId: number, quantity: number): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['variants'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (!product.variants || product.variants.length === 0) {
      throw new BadRequestException(`Product ${product.name} has no variants`);
    }

    const variant = product.variants.find((v) => v.isDefault) || product.variants[0];
    await this.reserveStock(variant.id, quantity);
  }

  /**
   * Release stock for a specific variant
   */
  async releaseStock(variantId: number, quantity: number): Promise<void> {
    const variant = await this.variantRepository.findOne({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${variantId} not found`);
    }

    await this.variantRepository.increment({ id: variantId }, 'quantity', quantity);
  }

  /**
   * Release stock for a product (uses default variant)
   */
  async releaseProductStock(productId: number, quantity: number): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['variants'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (!product.variants || product.variants.length === 0) {
      throw new BadRequestException(`Product ${product.name} has no variants`);
    }

    const variant = product.variants.find((v) => v.isDefault) || product.variants[0];
    await this.releaseStock(variant.id, quantity);
  }

  /**
   * Update stock for a specific variant
   */
  async updateStock(variantId: number, newQuantity: number): Promise<ProductVariant> {
    const variant = await this.variantRepository.findOne({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${variantId} not found`);
    }

    variant.quantity = newQuantity;
    return this.variantRepository.save(variant);
  }

  /**
   * Update stock for a product (uses default variant)
   * This method is kept for backward compatibility with the controller
   */
  async updateProductStock(productId: number, newQuantity: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['variants'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (!product.variants || product.variants.length === 0) {
      throw new BadRequestException(`Product ${product.name} has no variants`);
    }

    const variant = product.variants.find((v) => v.isDefault) || product.variants[0];
    variant.quantity = newQuantity;
    await this.variantRepository.save(variant);

    // Return product with updated variants
    return this.productRepository.findOne({
      where: { id: productId },
      relations: ['variants'],
    });
  }

  /**
   * Get low stock variants
   */
  async getLowStockVariants(threshold: number = 10): Promise<ProductVariant[]> {
    return this.variantRepository
      .createQueryBuilder('variant')
      .where('variant.quantity <= :threshold', { threshold })
      .andWhere('variant.quantity >= 0')
      .leftJoinAndSelect('variant.product', 'product')
      .getMany();
  }

  /**
   * Get low stock products (products with at least one low stock variant)
   */
  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    const lowStockVariants = await this.getLowStockVariants(threshold);
    const productIds = [...new Set(lowStockVariants.map((v) => v.productId))];

    if (productIds.length === 0) {
      return [];
    }

    return this.productRepository.find({
      where: productIds.map((id) => ({ id })),
      relations: ['variants', 'category'],
    });
  }

  /**
   * Get inventory report
   */
  async getInventoryReport(): Promise<any> {
    const totalProducts = await this.productRepository.count();
    const totalVariants = await this.variantRepository.count();

    // Get all variants with their products
    const variants = await this.variantRepository.find({
      relations: ['product'],
    });

    // Calculate low stock and out of stock
    const lowStockVariants = variants.filter((v) => v.quantity > 0 && v.quantity <= 10);
    const outOfStockVariants = variants.filter((v) => v.quantity === 0);

    // Calculate total inventory value (sum of all variant quantities * selling price)
    const totalInventoryValue = variants.reduce((sum, variant) => {
      return sum + Number(variant.sellingPrice) * variant.quantity;
    }, 0);

    // Get unique products with low stock
    const lowStockProductIds = [
      ...new Set(lowStockVariants.map((v) => v.productId)),
    ];
    const lowStockProducts = await this.productRepository.find({
      where: lowStockProductIds.map((id) => ({ id })),
      relations: ['variants', 'category'],
    });

    return {
      totalProducts,
      totalVariants,
      lowStockCount: lowStockVariants.length,
      outOfStockCount: outOfStockVariants.length,
      totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
      lowStockProducts,
      lowStockVariants: lowStockVariants.slice(0, 20), // Limit to first 20
    };
  }
}