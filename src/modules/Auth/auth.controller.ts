// src/modules/auth/auth.controller.ts
import { Controller, Post, Body, Logger, Get, UseGuards, Req, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './DTO/register.dto';
import { LoginDto } from './DTO/login.dto';
import { ResendVerificationDto } from './DTO/resend-verification.dto';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
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
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(loginDto);
    
    // Clear old cookie names (if they exist) to prevent duplicates
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    
    // Set HTTP-only cookies
    res.cookie('lumi_a_t', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes (matches JWT expiry)
      path: '/',
    });
    res.cookie('lumi_r_t', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  
    // Return only success message (no tokens, no user data)
    return res.json({
      message: 'User login successfully',
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
    });
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  async verify(@Req() req) {
    // req.user is populated by JwtAuthGuard from JWT token
    return {
      authenticated: true,  
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      },
    };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);
    
    // Clear old cookie names (if they exist) to prevent duplicates
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    
    // Set HTTP-only cookies
    res.cookie('lumi_a_t', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes (matches JWT expiry)
      path: '/',
    });
  
    res.cookie('lumi_r_t', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  
    // Redirect to frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/success`);
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

  @Post('refresh')
  async refresh(@Req() req, @Res() res: Response) {
    const refreshToken = req.cookies?.lumi_r_t;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    const result = await this.authService.refreshToken(refreshToken);
    
    // Clear old cookie names (if they exist) to prevent duplicates
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    
    // Set new HTTP-only cookies
    res.cookie('lumi_a_t', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes (matches JWT expiry)
      path: '/',
    });

    res.cookie('lumi_r_t', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return res.json({ message: 'Token refreshed successfully' });
  }

  @Post('logout')
  async logout(@Req() req, @Res() res: Response) {
    const refreshToken = req.cookies?.lumi_r_t;
    
    // Revoke refresh token in database if exists
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }

    // Clear cookies
    res.clearCookie('lumi_a_t', { path: '/' });
    res.clearCookie('lumi_r_t', { path: '/' });
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });

    return res.json({ message: 'Logged out successfully' });
  }
}
