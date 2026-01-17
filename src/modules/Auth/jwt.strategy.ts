import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../Users/users.service';

// Custom extractor to get JWT from cookies (no decryption needed - tokens are plain JWT)
const cookieExtractor = (req: Request): string | null => {
  let token = null;
  if (req && req.cookies) {
    // Get token from cookie - using lumi_a_t as the standard cookie name
    token = req.cookies['lumi_a_t'] || null;
  }
  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor, // Try cookie first (plain JWT, no decryption)
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Fallback to Authorization header
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findUserById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}