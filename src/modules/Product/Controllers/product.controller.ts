import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
  Query,
  Put,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductService } from '../Services/product.service';
import { CreateProductDto } from '../DTO/create-product.dto';
import { UpdateProductDto } from '../DTO/update-product.dto';
import { DeleteMultipleProductsDto } from '../DTO/delete-multiple-products.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productsService: ProductService) {}

  @Post('addNew')
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  create(
    @Body() dto: CreateProductDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    const imagePaths = images?.map((file) => `/uploads/${file.filename}`) || [];
    return this.productsService.create({ ...dto, images: imagePaths });
  }

  @Get()
  findAll(@Query('includeReviews') includeReviews?: string, @Query('search') search?: string,) {
    return this.productsService.findAll({
      includeReviews: includeReviews === 'true',
      search: search || undefined,

    });
  }


  @Get('slug/:slug')
  findBySlug(
    @Param('slug') slug: string,
    @Query('includeReviews') includeReviews?: string,
  ) {
    return this.productsService.findBySlug(slug, includeReviews === 'true');
  }

  /**
   * Get product by identifier (UUID or slug) - Smart routing
   * Examples:
   * - GET /products/881aed84-e14c-4c5d-9300-91874ba81847 (UUID)
   * - GET /products/glow-skin-moisturiser (slug)
   * Note: This is a catch-all route, so specific routes must come before it
   */
  @Get(':identifier')
  findOne(
    @Param('identifier') identifier: string,
    @Query('includeReviews') includeReviews?: string,
  ) {
    return this.productsService.findOne(identifier, includeReviews === 'true');
  }

  /**
   * Update product by identifier (UUID or slug) - Smart routing
   * Examples:
   * - PATCH /products/update/881aed84-e14c-4c5d-9300-91874ba81847 (UUID)
   * - PATCH /products/update/glow-skin-moisturiser (slug)
   */
  @Patch('update/:identifier')
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  update(
    @Param('identifier') identifier: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    const imagePaths = images?.map((file) => `/uploads/${file.filename}`) || [];
  
    return this.productsService.update(identifier, { ...dto, images: imagePaths });
  }

  /**
   * Delete product by identifier (UUID or slug) - Smart routing
   * Examples:
   * - DELETE /products/881aed84-e14c-4c5d-9300-91874ba81847 (UUID)
   * - DELETE /products/glow-skin-moisturiser (slug)
   */
  @Delete(':identifier')
  remove(@Param('identifier') identifier: string) {
    return this.productsService.remove(identifier);
  }

  @Post('delete')
  removeMultiple(@Body() dto: DeleteMultipleProductsDto) {
    console.log('dto.productIds:', dto.productIds);
    return this.productsService.removeMultiple(dto.productIds);
  }
}
