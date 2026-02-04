import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Address } from './Entities/address.entity';
import { User } from '../Users/Entities/user.entity';
import { CreateAddressDto } from './DTO/create-address.dto';
import { UpdateAddressDto } from './DTO/update-address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(userId: string, createAddressDto: CreateAddressDto): Promise<Address> {
    // Find user by UUID
    const user = await this.userRepository.findOne({ where: { userId: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If this is set as default, unset other default addresses
    if (createAddressDto.isDefault) {
      await this.addressRepository.update(
        { userId: user.id, isDefault: true },
        { isDefault: false },
      );
    }

    const address = this.addressRepository.create({
      ...createAddressDto,
      userId: user.id, // Use integer ID for foreign key
    });

    return this.addressRepository.save(address);
  }

  async findAll(userId: string): Promise<Address[]> {
    const user = await this.userRepository.findOne({ where: { userId: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const addresses = await this.addressRepository.find({
      where: { userId: user.id },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });

    // Backfill addressId for existing records
    for (const address of addresses) {
      if (!address.addressId) {
        const { v4: uuidv4 } = await import('uuid');
        address.addressId = uuidv4();
        await this.addressRepository.save(address);
      }
    }

    return addresses;
  }

  async findOne(addressId: string, userId: string): Promise<Address> {
    const user = await this.userRepository.findOne({ where: { userId: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const address = await this.addressRepository.findOne({
      where: { addressId: addressId, userId: user.id },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Backfill addressId if missing
    if (!address.addressId) {
      const { v4: uuidv4 } = await import('uuid');
      address.addressId = uuidv4();
      await this.addressRepository.save(address);
    }

    return address;
  }

  async update(
    addressId: string,
    userId: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.findOne(addressId, userId);

    // If setting as default, unset other default addresses
    if (updateAddressDto.isDefault === true) {
      await this.addressRepository.update(
        { userId: address.userId, isDefault: true, id: Not(address.id) },
        { isDefault: false },
      );
    }

    Object.assign(address, updateAddressDto);
    return this.addressRepository.save(address);
  }

  async remove(addressId: string, userId: string): Promise<void> {
    const address = await this.findOne(addressId, userId);
    await this.addressRepository.remove(address);
  }

  async setDefault(addressId: string, userId: string): Promise<Address> {
    const address = await this.findOne(addressId, userId);

    // Unset all other default addresses for this user
    await this.addressRepository.update(
      { userId: address.userId, isDefault: true },
      { isDefault: false },
    );

    // Set this address as default
    address.isDefault = true;
    return this.addressRepository.save(address);
  }

  async findByAddressId(addressId: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { addressId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Backfill addressId if missing
    if (!address.addressId) {
      const { v4: uuidv4 } = await import('uuid');
      address.addressId = uuidv4();
      await this.addressRepository.save(address);
    }

    return address;
  }
}

