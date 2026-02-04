import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { Address } from './Entities/address.entity';
import { User } from '../Users/Entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Address, User])],
  controllers: [AddressController],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {}
