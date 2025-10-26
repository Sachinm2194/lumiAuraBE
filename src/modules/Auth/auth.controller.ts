// src/modules/auth/auth.controller.ts
import { Controller, Post, Body, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './DTO/register.dto';
import { LoginDto } from './DTO/login.dto';


@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    // this.logger.log(`Register payload received: ${JSON.stringify(registerDto)}`);
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // this.logger.log(`Login payload received: ${JSON.stringify(loginDto)}`);
    return this.authService.login(loginDto);
  }
}
