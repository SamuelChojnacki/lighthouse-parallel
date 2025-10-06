/**
 * Centralized error messages for consistent error handling
 */

export const AUTH_ERROR_MESSAGES = {
  NO_TOKEN: 'No authentication token found. Please login first.',
  SESSION_EXPIRED: 'Session expired. Please login again.',
  TOKEN_REQUIRED: 'Authorization token required. Please login first.',
  INVALID_TOKEN: 'Invalid or expired token. Please login again.',
  INVALID_PASSWORD: 'Invalid password',
  PASSWORD_NOT_CONFIGURED: 'Dashboard password not configured on server',
  INVALID_HEADER_FORMAT: 'Invalid authorization header format',
} as const;
