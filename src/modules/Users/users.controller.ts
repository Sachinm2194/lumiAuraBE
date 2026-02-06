import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
  Request,
  NotFoundException,
  } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDTO } from './DTO/createUserDTO.dto';
import { UpdateUserDTO } from './DTO/updateUser.dto';
import { JwtAuthGuard } from '../Auth/guards/jwt-auth.guard';

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
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    const userId = req.user.userId; // Get UUID from JWT
    return this.usersService.getUserProfile(userId);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Body() updateUserDto: UpdateUserDTO,
    @Request() req: any,
  ) {
    const userId = req.user.userId; // Get UUID from JWT
    const user = await this.usersService.findUserByUserId(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersService.updateUser(user.id, updateUserDto);
    return this.usersService.getUserProfile(userId);
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
