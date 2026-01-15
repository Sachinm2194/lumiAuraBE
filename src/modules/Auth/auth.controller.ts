// src/modules/auth/auth.controller.ts
import { Controller, Post, Body, Logger, Get, UseGuards, Req, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './DTO/register.dto';
import { LoginDto } from './DTO/login.dto';
import { ResendVerificationDto } from './DTO/resend-verification.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    console.log('Register payload received:', registerDto);
    // this.logger.log(`Register payload received: ${JSON.stringify(registerDto)}`);
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // this.logger.log(`Login payload received: ${JSON.stringify(loginDto)}`);
    return this.authService.login(loginDto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req) {
    return this.authService.googleLogin(req.user);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  async resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(resendVerificationDto.email);
  }

  @Post('cleanup-expired-accounts')
  async cleanupExpiredAccounts() {
    return this.authService.cleanupExpiredUnverifiedAccounts();
  }

  @Get('get-verification-token')
  async getVerificationToken(@Query('email') email: string) {
    return this.authService.getVerificationTokenByEmail(email);
  }

  @Get('view-password-hash')
  async viewPasswordHash(@Query('email') email: string) {
    return this.authService.getPasswordHash(email);
  }
}
