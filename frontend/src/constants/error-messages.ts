/**
 * Centralized error messages for frontend
 */

export const AUTH_ERROR_MESSAGES = {
  NO_TOKEN: 'No authentication token found. Please login first.',
  SESSION_EXPIRED: 'Session expired. Please login again.',
  CONFIG_FETCH_FAILED: 'Failed to fetch API configuration',
  API_KEY_NOT_FOUND: 'API Key not found in configuration',
  LOGIN_FAILED: 'Login failed',
  NO_TOKEN_RECEIVED: 'No token received from server',
  INVALID_PASSWORD: 'Invalid password',
} as const;
