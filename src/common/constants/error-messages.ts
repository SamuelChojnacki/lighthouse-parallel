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

export const API_ERROR_MESSAGES = {
  CONFIG_FETCH_FAILED: 'Failed to fetch API configuration',
  API_KEY_NOT_FOUND: 'API Key not found in configuration',
  LOGIN_FAILED: 'Login failed',
  NO_TOKEN_RECEIVED: 'No token received from server',
} as const;
