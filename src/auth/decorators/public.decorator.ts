import { SetMetadata } from '@nestjs/common';

/**
 * Key used to mark routes as public (bypass API Key authentication)
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark endpoints as public (no API Key required)
 * Use this for health checks or other public endpoints
 *
 * @example
 * @Public()
 * @Get('health')
 * healthCheck() {
 *   return { status: 'ok' };
 * }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
