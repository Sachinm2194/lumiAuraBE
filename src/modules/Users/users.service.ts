import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './Entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDTO } from './DTO/createUserDTO.dto';
import { UpdateUserDTO } from './DTO/updateUser.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async createUser(createUserDTO: CreateUserDTO) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDTO.email },
    });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }
    const user = this.userRepository.create(createUserDTO);
    return this.userRepository.save(user);
  }
  findAllUsers() {
    return this.userRepository.find();
  }
  findUserById(id: number) {
    return this.userRepository.findOne({where:{id}});
  }
  findUserByEmail(email: string) {
    return this.userRepository.findOne({where:{email}});
  }
  updateUser(id: number, updateUserDTO: UpdateUserDTO) {
    return this.userRepository.update(id, updateUserDTO);
  }
  deleteUser(id: number) {
    return this.userRepository.delete(id);
  }
}
