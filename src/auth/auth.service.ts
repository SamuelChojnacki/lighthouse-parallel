import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AUTH_ERROR_MESSAGES } from '../common/constants/error-messages';

/**
 * Service handling authentication operations
 * Validates passwords using bcrypt and generates JWT tokens
 */
@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  /**
   * Validates user password and generates JWT token
   * @param password - Plain text password from user
   * @returns Object containing JWT access token
   * @throws UnauthorizedException if password is invalid
   */
  async validatePassword(password: string): Promise<{ access_token: string }> {
    const hashedPassword = this.configService.get<string>('DASHBOARD_PASSWORD_HASH');

    if (!hashedPassword) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.PASSWORD_NOT_CONFIGURED);
    }

    // Compare password with bcrypt hash
    const isValid = await bcrypt.compare(password, hashedPassword);

    if (!isValid) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_PASSWORD);
    }

    // Generate JWT token valid for 24 hours
    const payload = { type: 'dashboard', timestamp: Date.now() };
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }

  /**
   * Validates JWT token
   * @param token - JWT token to validate
   * @returns true if token is valid, false otherwise
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      this.jwtService.verify(token);
      return true;
    } catch {
      return false;
    }
  }
}
