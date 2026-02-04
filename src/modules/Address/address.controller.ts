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
  Put,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './DTO/create-address.dto';
import { UpdateAddressDto } from './DTO/update-address.dto';
import { JwtAuthGuard } from '../Auth/guards/jwt-auth.guard';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  create(@Body() createAddressDto: CreateAddressDto, @Request() req: any) {
    const userId = req.user.userId; // Get UUID from JWT
    return this.addressService.create(userId, createAddressDto);
  }

  @Get()
  findAll(@Request() req: any) {
    const userId = req.user.userId; // Get UUID from JWT
    return this.addressService.findAll(userId);
  }

  @Get(':addressId')
  findOne(@Param('addressId') addressId: string, @Request() req: any) {
    const userId = req.user.userId; // Get UUID from JWT
    return this.addressService.findOne(addressId, userId);
  }

  @Put(':addressId')
  update(
    @Param('addressId') addressId: string,
    @Body() updateAddressDto: UpdateAddressDto,
    @Request() req: any,
  ) {
    const userId = req.user.userId; // Get UUID from JWT
    return this.addressService.update(addressId, userId, updateAddressDto);
  }

  @Delete(':addressId')
  remove(@Param('addressId') addressId: string, @Request() req: any) {
    const userId = req.user.userId; // Get UUID from JWT
    return this.addressService.remove(addressId, userId);
  }

  @Put(':addressId/set-default')
  setDefault(@Param('addressId') addressId: string, @Request() req: any) {
    const userId = req.user.userId; // Get UUID from JWT
    return this.addressService.setDefault(addressId, userId);
  }
}

