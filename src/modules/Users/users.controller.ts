import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDTO } from './DTO/createUserDTO.dto';
import { UpdateUserDTO } from './DTO/updateUser.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Post('newUser')
  createUser(@Body() createUserDTO: CreateUserDTO) {
    return this.usersService.createUser(createUserDTO);
  }
  @Get()
  findAllUsers() {
    return this.usersService.findAllUsers();
  }
  @Get(':id')
  findUserById(@Param('id') id: number) {
    return this.usersService.findUserById(id);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDTO) {
    return this.usersService.updateUser(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.deleteUser(+id);
  }
}
