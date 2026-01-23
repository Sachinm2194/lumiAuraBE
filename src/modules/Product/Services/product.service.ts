// src/modules/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from '../Entities/product.entity';
import { Category } from '../Entities/category.entity';
import { CreateProductDto } from '../DTO/create-product.dto';
import { UpdateProductDto } from '../DTO/update-product.dto';
import { ProductVariant } from '../Entities/product-variant.entity';
import { ProductImage } from '../Entities/product-image.entity';
import { ProductTag } from '../Entities/product-tag.entity';
import { Tag } from '../Entities/tag.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(ProductVariant)
    private productVariantRepo: Repository<ProductVariant>,
    @InjectRepository(ProductImage)
    private productImageRepo: Repository<ProductImage>,
    @InjectRepository(ProductTag)
    private productTagRepo: Repository<ProductTag>,
    @InjectRepository(Tag) private tagRepo: Repository<Tag>,
  ) {}

  /**
   * Auto-generate SKU from product name and variant name
   * Format: ProductInitials-VariantName (e.g., "Moisturizing Face Cream" + "30ml" = "MFC-30ML")
   */
  private async generateSku(
    productName: string,
    variantName: string,
    excludeSku?: string,
  ): Promise<string> {
    // Get first letters of each word from product name (max 4 letters)
    const productInitials = productName
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 4);

    // Clean variant name (remove spaces, uppercase)
    const cleanVariant = variantName.replace(/\s+/g, '').toUpperCase();

    // Generate base SKU
    let baseSku = `${productInitials}-${cleanVariant}`;

    // Check if SKU already exists, if so add a number suffix
    let sku = baseSku;
    let counter = 1;
    while (true) {
      const existingVariant = await this.productVariantRepo.findOne({
        where: { sku },
      });

      // If SKU doesn't exist, or it's the same variant we're updating, use it
      if (!existingVariant || (excludeSku && existingVariant.sku === excludeSku)) {
        break;
      }

      // SKU exists, try with a number suffix
      sku = `${baseSku}-${counter}`;
      counter++;
    }

    return sku;
  }

  /**
   * Sort variants by variantName using natural sort (numeric first, then unit)
   * Examples: 20gm, 30ml, 50ml, 100ml
   */
  private sortVariantsByVariantName(variants: ProductVariant[]): ProductVariant[] {
    if (!variants || variants.length === 0) return variants;

    return [...variants].sort((a, b) => {
      const nameA = a.variantName || '';
      const nameB = b.variantName || '';

      // Extract numeric value from variant name (e.g., "30ml" -> 30, "50gm" -> 50)
      const extractNumber = (str: string): number => {
        const match = str.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };

      const numA = extractNumber(nameA);
      const numB = extractNumber(nameB);

      // If both have numbers, sort by number
      if (numA !== numB) {
        return numA - numB;
      }

      // If numbers are equal, sort alphabetically by unit (ml, gm, etc.)
      return nameA.localeCompare(nameB);
    });
  }

  /**
   * Sort variants in product and return sorted product
   */
  private sortProductVariants(product: Product): Product {
    if (product && product.variants) {
      product.variants = this.sortVariantsByVariantName(product.variants);
    }
    return product;
  }

  /**
   * Sort variants in products array
   */
  private sortProductsVariants(products: Product[]): Product[] {
    return products.map(product => this.sortProductVariants(product));
  }

  async create(dto: CreateProductDto & { images?: string[] }) {
    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) throw new BadRequestException('Category not found');

    const product = this.productRepo.create({
      name: dto.name,
      shortDescription: dto.shortDescription,
      description: dto.description,
      ingredients: dto.ingredients,
      benefits: dto.benefits,
      howToUse: dto.howToUse,
      warnings: dto.warnings,
      skinType: dto.skinType,
      concerns: dto.concerns,
      suitableFor: dto.suitableFor,
      isFeatured: dto.isFeatured || false,
      isNew: dto.isNew || false,
      status: dto.status || 'draft',
      category,
    });

    const savedProduct = await this.productRepo.save(product);

    // 3. Create variants
    if (dto.variants && dto.variants.length > 0) {
      const variants = await Promise.all(
        dto.variants.map(async (variantDto, index) => {
          // Auto-generate SKU if not provided
          const sku =
            variantDto.sku ||
            (await this.generateSku(dto.name, variantDto.variantName));

          return this.productVariantRepo.create({
            ...variantDto,
            sku,
            productId: savedProduct.id,
            isDefault: index === 0 || variantDto.isDefault,
          });
        }),
      );
      await this.productVariantRepo.save(variants);
    }

    if (dto.images && dto.images.length > 0) {
      const images = dto.images.map((imageUrl, index) =>
        this.productImageRepo.create({
          productId: savedProduct.id,
          imageUrl,
          altText: `${dto.name} - Image ${index + 1}`,
          isPrimary: index === 0,
          sortOrder: index,
        }),
      );
      await this.productImageRepo.save(images);
    }
    // 5. Create product-tag relationships
    if (dto.tagIds && dto.tagIds.length > 0) {
      const tags = await this.tagRepo.find({
        where: { id: In(dto.tagIds) },
      });

      if (tags.length !== dto.tagIds.length) {
        throw new BadRequestException('Some tags not found');
      }

      const productTags = tags.map((tag) =>
        this.productTagRepo.create({
          productId: savedProduct.id,
          tagId: tag.id,
        }),
      );
      await this.productTagRepo.save(productTags);
    }
    // 6. Return product with relations
    return this.findOneById(savedProduct.productId);
  }

  async findAll(options?: {
    status?: 'draft' | 'active' | 'archived';
    categoryId?: number;
    isFeatured?: boolean;
    includeReviews?: boolean; // Add this optional parameter

  }) {
    const where: any = {};
    if (options?.status) where.status = options.status;
    if (options?.categoryId) where.categoryId = options.categoryId;
    if (options?.isFeatured !== undefined)
      where.isFeatured = options.isFeatured;

    const relations: string[] = ['category', 'variants', 'images', 'tags', 'tags.tag'];
    if (options?.includeReviews) {
      relations.push('reviews');
    }

    const products = await this.productRepo.find({
      where,
      relations,
      order: {
        createdAt: 'DESC',
      },
    });

    // Sort variants in all products
    return this.sortProductsVariants(products);
  }

  /**
   * Helper method to check if identifier is UUID format
   */
  private isUUID(identifier: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(identifier);
  }

  /**
   * Resolve identifier (UUID or slug) to productId (UUID)
   * Used internally for update/delete operations
   */
  private async resolveToProductId(identifier: string): Promise<string> {
    if (this.isUUID(identifier)) {
      // Already a UUID, verify it exists
      const product = await this.productRepo.findOne({
        where: { productId: identifier },
        select: ['productId'],
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      return identifier;
    } else {
      // It's a slug, find product and return productId
      const product = await this.productRepo.findOne({
        where: { slug: identifier },
        select: ['productId'],
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      return product.productId;
    }
  }

  /**
   * Find product by identifier (UUID or slug) - Smart routing
   */
  async findOne(identifier: string, includeReviews = false): Promise<Product> {
    const relations = ['category', 'variants', 'images', 'tags', 'tags.tag'];
    if (includeReviews) {
      relations.push('reviews');
    }

    let product: Product | null;
    if (this.isUUID(identifier)) {
      product = await this.productRepo.findOne({
        where: { productId: identifier },
        relations,
      });
    } else {
      product = await this.productRepo.findOne({
        where: { slug: identifier },
        relations,
      });
    }

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Sort variants before returning
    return this.sortProductVariants(product);
  }

  async findOneById(productId: string, includeReviews = false): Promise<Product> {
    const relations = ['category', 'variants', 'images', 'tags', 'tags.tag'];
    if (includeReviews) {
      relations.push('reviews');
    }

    const product = await this.productRepo.findOne({
      where: { productId },
      relations,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Sort variants before returning
    return this.sortProductVariants(product);
  }

  async findBySlug(slug: string, includeReviews = false): Promise<Product> {
    const relations = [
      'category',
      'variants',
      'images',
      'tags',
      'tags.tag',
    ];
    if (includeReviews) {
      relations.push('reviews');
    }

    const product = await this.productRepo.findOne({
      where: { slug },
      relations,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Sort variants before returning
    return this.sortProductVariants(product);
  }

  /**
   * Update product by identifier (UUID or slug) - Smart routing
   */
  async update(
    identifier: string,
    dto: UpdateProductDto & { images?: string[] },
  ): Promise<Product> {
    // Resolve identifier to productId (UUID)
    const productId = await this.resolveToProductId(identifier);
    const product = await this.findOneById(productId);

    // Update category if provided
    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new BadRequestException('Category not found');
      }
      product.category = category;
    }

    // Update product fields
    Object.assign(product, {
      name: dto.name,
      shortDescription: dto.shortDescription,
      description: dto.description,
      ingredients: dto.ingredients,
      howToUse: dto.howToUse,
      warnings: dto.warnings,
      skinType: dto.skinType,
      concerns: dto.concerns,
      suitableFor: dto.suitableFor,
      isFeatured: dto.isFeatured,
      isNew: dto.isNew,
      status: dto.status,
    });

    await this.productRepo.save(product);

    // Update variants if provided
    if (dto.variants) {
      // Delete existing variants - use integer id for FK
      await this.productVariantRepo.delete({ productId: product.id });
      // Create new variants
      const variants = await Promise.all(
        dto.variants.map(async (variantDto, index) => {
          // Auto-generate SKU if not provided
          const sku =
            variantDto.sku ||
            (await this.generateSku(
              dto.name || product.name,
              variantDto.variantName,
            ));

          return this.productVariantRepo.create({
            ...variantDto,
            sku,
            productId: product.id,
            isDefault: index === 0 || variantDto.isDefault,
          });
        }),
      );
      await this.productVariantRepo.save(variants);
    }

    // Update images if provided
    if (dto.images) {
      // Delete existing images - use integer id for FK
      await this.productImageRepo.delete({ productId: product.id });
      // Create new images
      const images = dto.images.map((imageUrl, index) =>
        this.productImageRepo.create({
          productId: product.id,
          imageUrl,
          altText: `${product.name} - Image ${index + 1}`,
          isPrimary: index === 0,
          sortOrder: index,
        }),
      );
      await this.productImageRepo.save(images);
    }

    // Update tags if provided
    if (dto.tagIds !== undefined) {
      // Delete existing product tags - use integer id for FK
      await this.productTagRepo.delete({ productId: product.id });
      // Create new product tags
      if (dto.tagIds.length > 0) {
        const tags = await this.tagRepo.find({
          where: { id: In(dto.tagIds) },
        });
        const productTags = tags.map((tag) =>
          this.productTagRepo.create({
            productId: product.id,
            tagId: tag.id,
          }),
        );
        await this.productTagRepo.save(productTags);
      }
    }

    return this.findOneById(product.productId);
  }

  /**
   * Remove product by identifier (UUID or slug) - Smart routing
   */
  async remove(identifier: string): Promise<void> {
    // Resolve identifier to productId (UUID)
    const productId = await this.resolveToProductId(identifier);
    const product = await this.findOneById(productId);
    await this.productRepo.remove(product);
  }

  async removeMultiple(productIds: string[]): Promise<void> {
    const products = await this.productRepo.find({
      where: productIds.map((productId) => ({ productId })),
    });

    if (products.length === 0) {
      throw new NotFoundException(
        'No products found with the provided productIds',
      );
    }

    await this.productRepo.remove(products);
  }
}
