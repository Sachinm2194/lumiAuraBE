import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { UsersModule } from '../Users/users.module';
import { NotificationModule } from '../Notification/notification.module';

@Module({
  imports: [
    UsersModule,
    NotificationModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, JwtAuthGuard, AdminGuard],
  controllers: [AuthController],
  exports: [JwtAuthGuard, AdminGuard, AuthService],
})
export class AuthModule {}
