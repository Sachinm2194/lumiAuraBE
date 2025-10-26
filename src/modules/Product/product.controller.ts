import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  Put,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductService } from './product.service';
import { CreateProductDto } from './DTO/create-product.dto';
import { UpdateProductDto } from './DTO/update-product.dto';
import { DeleteMultipleProductsDto } from './DTO/delete-multiple-products.dto';

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
  findAll() {
    return this.productsService.findAll();
  }

  @Get('byId/:id')
  findOneById(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOneById(id);
  }

  @Get('guid/:productId')
  findOneByGuid(@Param('productId') productId: string) {
    return this.productsService.findOneByGuid(productId);
  }

  @Patch('update/:id')
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
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    const imagePaths = images?.map((file) => `/uploads/${file.filename}`) || [];
  
    return this.productsService.update(id, { ...dto, images: imagePaths });
  }

  @Post('delete')
  removeMultiple(@Body() dto: DeleteMultipleProductsDto) {
    console.log('dto.ids:', dto.ids); // should log [10, 11]
    return this.productsService.removeMultiple(dto.ids);
  }

  // @Delete('delete/:id')
  // remove(@Param('id', ParseIntPipe) id: number) {
  //   console.log("id", id);
  //   return this.productsService.remove(id);
  // }
}
