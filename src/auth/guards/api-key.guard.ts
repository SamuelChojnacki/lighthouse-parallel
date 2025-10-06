import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_TOKEN_PROTECTED_KEY } from '../decorators/token-protected.decorator';

/**
 * Guard that validates API Key from X-API-Key header
 * Can be bypassed for endpoints marked with @Public() decorator
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Allow Swagger UI and documentation paths (but all API endpoints require auth)
    const swaggerPaths = ['/api', '/api-json', '/api-yaml'];
    if (swaggerPaths.some((path) => request.url.startsWith(path))) {
      return true;
    }

    // Check if endpoint is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Check if endpoint is token-protected (should skip API Key validation)
    const isTokenProtected = this.reflector.getAllAndOverride<boolean>(IS_TOKEN_PROTECTED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isTokenProtected) {
      return true; // Skip API Key check, TokenGuard will handle it
    }
    const apiKey = request.headers['x-api-key'];
    const validApiKey = this.configService.get<string>('API_KEY');

    if (!validApiKey) {
      this.logger.error('API_KEY not configured in environment variables. Security is disabled!');
      throw new UnauthorizedException('API security not properly configured');
    }

    if (!apiKey) {
      this.logger.warn(
        `Unauthorized access attempt to ${request.method} ${request.url} - Missing API Key`,
      );
      throw new UnauthorizedException('API Key is required');
    }

    if (apiKey !== validApiKey) {
      this.logger.warn(
        `Unauthorized access attempt to ${request.method} ${request.url} - Invalid API Key: ${apiKey.substring(0, 8)}...`,
      );
      throw new UnauthorizedException('Invalid API Key');
    }

    return true;
  }
}
