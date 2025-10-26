// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../Users/users.service';
import { RegisterDto } from './DTO/register.dto';
import { LoginDto } from './DTO/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // REGISTER
  async register(registerDto: RegisterDto) {
    const { email, password, name, phone } = registerDto;

    this.logger.log(`Register attempt for: ${email}`);

    // Check if user already exists
    const existingUser = await this.usersService.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.usersService.createUser({
      email,
      password: hashedPassword,
      name,
      phone,
    });

    this.logger.log(`User registered successfully: ${email}`);

    // Return user without password
    const { password: _, ...result } = user;
    return { message: 'User registered successfully', user: result };
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

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Create JWT payload
    const payload = { sub: user.id, email: user.email ,name: user.name, phone: user.phone,role: user.role};
    this.logger.log(`payload: ${payload.name } ${payload.email} ${payload.phone} ${payload.role}`);

    // Sign JWT (you can set expiration to 7 days)
    const access_token = this.jwtService.sign(payload, {
      expiresIn: '7d', // 7 days
    });

    this.logger.log(`User logged in successfully: ${email}`);

    return { access_token };
  }
}
