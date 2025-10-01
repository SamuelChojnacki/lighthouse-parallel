import { SetMetadata } from '@nestjs/common';

export const IS_TOKEN_PROTECTED_KEY = 'isTokenProtected';

/**
 * Decorator to mark endpoints as token-protected (JWT Bearer token required)
 * This bypasses the API Key guard and uses TokenGuard instead
 */
export const TokenProtected = () => SetMetadata(IS_TOKEN_PROTECTED_KEY, true);
