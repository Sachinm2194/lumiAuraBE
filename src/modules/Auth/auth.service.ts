// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../Users/users.service';
import { NotificationService } from '../Notification/notification.service';
import { RegisterDto } from './DTO/register.dto';
import { LoginDto } from './DTO/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  // REGISTER
  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, phone } = registerDto;

    this.logger.log(`Register attempt for: ${email}`);

    // Check if user already exists
    const existingUser = await this.usersService.findUserByEmail(email);
    if (existingUser) {
      // If user is verified, throw error
      if (existingUser.isVerified) {
        throw new ConflictException('Email is already in use');
      }

      // If user exists but is not verified, check if we should delete:
      // 1. Token is expired (verificationTokenExpiry < now), OR
      // 2. Account was created more than 24 hours ago (user had time to verify)
      const now = new Date();
      const isTokenExpired = existingUser.verificationTokenExpiry 
        ? existingUser.verificationTokenExpiry < now 
        : false;
      const isAccountOld = existingUser.createdAt 
        ? (now.getTime() - existingUser.createdAt.getTime()) > 24 * 60 * 60 * 1000 // 24 hours in milliseconds
        : false;

      if (isTokenExpired || isAccountOld) {
        // Delete expired or old unverified account to allow re-registration
        this.logger.log(`Deleting ${isTokenExpired ? 'expired' : 'old'} unverified account for: ${email}`);
        await this.usersService.deleteUser(existingUser.id);
        this.logger.log(`Unverified account deleted, proceeding with new registration for: ${email}`);
      } else {
        // Token is still valid and account is recent - don't allow re-registration
        throw new ConflictException(
          'An unverified account exists for this email. Please check your inbox for the verification link or wait 24 hours before re-registering.'
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Log password info (DEV MODE ONLY - Remove in production!)
    this.logger.warn(`═══════════════════════════════════════════════════════`);
    this.logger.warn(`🔑 [DEV MODE] PASSWORD INFORMATION FOR: ${email}`);
    this.logger.warn(`   Original Password: "${password}"`);
    this.logger.warn(`   Hashed Password (DB): ${hashedPassword}`);
    this.logger.warn(`═══════════════════════════════════════════════════════`);

    // Generate verification token
    const verificationToken = uuidv4();
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24); // 24 hours expiry

    // Create user
    const user = await this.usersService.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      authProvider: 'email',
      isVerified: false,
      verificationToken,
      verificationTokenExpiry,
    });

    // Send verification email
    try {
      await this.notificationService.sendVerificationEmail(
        email,
        verificationToken,
        firstName,
      );
      this.logger.log(`Verification email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      // Don't throw error - user is created, they can request resend later
    }

    this.logger.log(`User registered successfully: ${email}`);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    // In development, include verification token if email sending failed
    const response: any = { 
      message: 'User registered successfully. Please check your email to verify your account.', 
      user: { ...userWithoutPassword, verificationToken: undefined }
    };
    
    // If email failed to send, include token in response for development/testing
    // Check if we're in development mode (NODE_ENV !== 'production')
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (isDevelopment) {
      // Log the verification token for development
      this.logger.warn(`[DEV MODE] Verification token for ${email}: ${verificationToken}`);
      this.logger.warn(`[DEV MODE] Verification URL: http://localhost:9000/auth/verify-email?token=${verificationToken}`);
    }
    
    return response;
  }

  // LOGIN
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    this.logger.log(`Login attempt for: ${email}`);

    // Find user
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user registered with Google (no password)
    if (user.authProvider === 'google' || !user.password) {
      throw new UnauthorizedException('Please use Google login for this account');
    }

    // Check if email is verified
    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before logging in. Check your inbox for the verification link.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    // Log password verification info (DEV MODE ONLY)
    this.logger.warn(`═══════════════════════════════════════════════════════`);
    this.logger.warn(`🔑 [DEV MODE] LOGIN PASSWORD VERIFICATION FOR: ${email}`);
    this.logger.warn(`   Original Password Entered: "${password}"`);
    this.logger.warn(`   Hashed Password from DB: ${user.password}`);
    this.logger.warn(`   Verification Result: ${isPasswordValid ? '✅ VALID - Password matches!' : '❌ INVALID - Password does not match!'}`);
    this.logger.warn(`═══════════════════════════════════════════════════════`);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Create JWT payload
    const payload = { sub: user.id, email: user.email ,firstName: user.firstName, lastName: user.lastName, phone: user.phone,role: user.role};
    this.logger.log(`payload: ${payload.firstName } ${payload.lastName} ${payload.email} ${payload.phone} ${payload.role}`);

    // Sign JWT (you can set expiration to 7 days)  
    const jwtToken = this.jwtService.sign(payload, {
      expiresIn: '7d', // 7 days
    });

    // Encrypt the JWT token before sending
    const encryptedToken = this.encryptToken(jwtToken);

    this.logger.log(`User logged in successfully: ${email}`);
    this.logger.warn(`[DEV MODE] Original JWT: ${jwtToken}`);
    this.logger.warn(`[DEV MODE] Encrypted Token: ${encryptedToken}`);

    return { access_token: encryptedToken };
  }

  // GOOGLE OAUTH
  async googleLogin(user: any) {
    if (!user) {
      throw new UnauthorizedException('No user from Google');
    }

    this.logger.log(`Google login attempt for: ${user.email}`);

    // Check if user exists
    let existingUser = await this.usersService.findUserByEmail(user.email);

    if (!existingUser) {
      // Create new user from Google (auto-verified since Google already verified the email)
      this.logger.log(`Creating new user from Google: ${user.email}`);
      existingUser = await this.usersService.createUser({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        authProvider: 'google',
        isVerified: true, // Google OAuth users are auto-verified
      });
    } else {
      // If user exists but registered with email, update authProvider if needed
      if (existingUser.authProvider !== 'google') {
        // Optionally update authProvider or throw error
        this.logger.warn(`User ${user.email} exists with ${existingUser.authProvider} auth, attempting Google login`);
      }
    }

    // Create JWT payload
    const payload = {
      sub: existingUser.id,
      email: existingUser.email,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      phone: existingUser.phone,
      role: existingUser.role,
    };

    // Sign JWT
    const jwtToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    // Encrypt the JWT token before sending
    const encryptedToken = this.encryptToken(jwtToken);

    this.logger.log(`Google user logged in successfully: ${user.email}`);
    this.logger.warn(`[DEV MODE] Original JWT: ${jwtToken}`);
    this.logger.warn(`[DEV MODE] Encrypted Token: ${encryptedToken}`);

    return { access_token: encryptedToken, user: existingUser };
  }

  // VERIFY EMAIL
  async verifyEmail(token: string) {
    this.logger.log(`Email verification attempt with token: ${token}`);

    // Find user by verification token
    const user = await this.usersService.findUserByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Check if token is expired
    if (user.verificationTokenExpiry && new Date() > user.verificationTokenExpiry) {
      throw new BadRequestException('Verification token has expired. Please request a new one.');
    }

    // Check if already verified
    if (user.isVerified) {
      return { message: 'Email is already verified' };
    }

    // Update user to verified
    await this.usersService.updateUser(user.id, {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    });

    this.logger.log(`Email verified successfully for: ${user.email}`);

    return { message: 'Email verified successfully. You can now log in.' };
  }

  // RESEND VERIFICATION EMAIL
  async resendVerificationEmail(email: string) {
    this.logger.log(`Resend verification email request for: ${email}`);

    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return { message: 'If an account exists with this email, a verification link has been sent.' };
    }

    if (user.isVerified) {
      return { message: 'Email is already verified' };
    }

    // Generate new verification token
    const verificationToken = uuidv4();
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);

    // Update user with new token
    await this.usersService.updateUser(user.id, {
      verificationToken,
      verificationTokenExpiry,
    });

    // Send verification email
    try {
      await this.notificationService.sendVerificationEmail(
        email,
        verificationToken,
        user.firstName,
      );
      this.logger.log(`Verification email resent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to resend verification email to ${email}:`, error);
      throw new BadRequestException('Failed to send verification email. Please try again later.');
    }

    return { message: 'Verification email sent. Please check your inbox.' };
  }

  // CLEANUP EXPIRED UNVERIFIED ACCOUNTS
  async cleanupExpiredUnverifiedAccounts() {
    this.logger.log('Starting cleanup of expired unverified accounts...');
    
    const deletedCount = await this.usersService.deleteExpiredUnverifiedUsers();
    
    this.logger.log(`Cleaned up ${deletedCount} expired unverified accounts`);
    
    return { 
      message: `Cleaned up ${deletedCount} expired unverified accounts`,
      deletedCount 
    };
  }

  // AUTOMATIC CLEANUP - Runs daily at 2 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCron() {
    this.logger.log('Running scheduled cleanup of expired unverified accounts...');
    await this.cleanupExpiredUnverifiedAccounts();
  }

  // GET PASSWORD HASH (Development/Testing only)
  async getPasswordHash(email: string) {
    this.logger.warn(`[DEV MODE] Password hash requested for: ${email}`);
    
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      email: user.email,
      hashedPassword: user.password,
      authProvider: user.authProvider,
      message: '⚠️ This is for development/testing only. Passwords are hashed with bcrypt and cannot be decrypted.',
      note: 'To verify a password, use the login endpoint which compares the password against this hash.',
    };
  }

  // GET VERIFICATION TOKEN (Development/Testing only)
  async getVerificationTokenByEmail(email: string) {
    this.logger.log(`Getting verification token for: ${email}`);
    
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      return { message: 'Email is already verified' };
    }

    if (!user.verificationToken) {
      throw new BadRequestException('No verification token found for this user');
    }

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/verify-email?token=${user.verificationToken}`;
    const apiUrl = `http://localhost:9000/auth/verify-email?token=${user.verificationToken}`;

    return {
      email: user.email,
      verificationToken: user.verificationToken,
      verificationUrl,
      apiUrl,
      expiresAt: user.verificationTokenExpiry,
      message: 'Use this token to verify your email. This endpoint is for development/testing only.',
    };
  }

  // ENCRYPT TOKEN (AES-256-CBC)
  private encryptToken(token: string): string {
    const algorithm = 'aes-256-cbc';
    // Use JWT_SECRET from env, pad or truncate to 32 characters for AES-256
    const jwtSecret = this.configService.get<string>('JWT_SECRET') ;
    const secretKey = jwtSecret.padEnd(32, '0').substring(0, 32); // Ensure exactly 32 chars
    
    const iv = crypto.randomBytes(16); // Initialization vector

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV + encrypted data (IV is needed for decryption)
    return iv.toString('hex') + ':' + encrypted;
  }
}


