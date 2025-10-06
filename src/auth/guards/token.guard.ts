import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AUTH_ERROR_MESSAGES } from '../../common/constants/error-messages';

/**
 * Guard that validates JWT tokens for accessing frontend configuration
 * Used only on /config/public endpoint to protect API Key from unauthorized access
 */
@Injectable()
export class TokenGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Validates JWT token from Authorization header
   * @param context - Execution context containing request
   * @returns true if token is valid
   * @throws UnauthorizedException if token is missing, malformed, or invalid
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Extract token from Authorization header
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.TOKEN_REQUIRED);
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_HEADER_FORMAT);
    }

    try {
      // Verify token using JWT secret
      const secret = this.configService.get<string>('JWT_SECRET');
      this.jwtService.verify(token, { secret });
      return true;
    } catch {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_TOKEN);
    }
  }
}
