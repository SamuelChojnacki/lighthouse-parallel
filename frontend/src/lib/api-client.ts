import { AUTH_ERROR_MESSAGES } from '../constants/error-messages';

/**
 * API Client with automatic API Key authentication
 * All requests automatically include the X-API-Key header
 * API Key is fetched from /config/public endpoint (requires JWT token)
 */

let API_KEY: string | null = null;
let apiKeyPromise: Promise<string> | null = null;

/**
 * Get authentication token from sessionStorage
 * Token is stored after successful login
 */
function getAuthToken(): string | null {
  return sessionStorage.getItem('auth_token');
}

/**
 * Fetch API key from backend config endpoint
 * Requires valid JWT token in sessionStorage
 * Uses a shared promise to prevent multiple parallel requests
 * @public - Exported for use in hooks that need raw fetch() with API key
 */
export async function getApiKey(): Promise<string> {
  // Return cached key if available
  if (API_KEY) return API_KEY;

  // Return existing promise if a fetch is already in progress
  if (apiKeyPromise) return apiKeyPromise;

  // Create new promise for fetching API key
  apiKeyPromise = (async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error(AUTH_ERROR_MESSAGES.NO_TOKEN);
      }

      const response = await fetch('/config/public', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If unauthorized, token might be expired
        if (response.status === 401) {
          sessionStorage.removeItem('auth_token');
          throw new Error(AUTH_ERROR_MESSAGES.SESSION_EXPIRED);
        }
        throw new Error(AUTH_ERROR_MESSAGES.CONFIG_FETCH_FAILED);
      }

      const config = await response.json();
      API_KEY = config.apiKey;

      if (!API_KEY) {
        console.error('API Key not found in configuration');
        throw new Error(AUTH_ERROR_MESSAGES.API_KEY_NOT_FOUND);
      }

      console.log('✅ API Key loaded successfully');
      return API_KEY;
    } catch (error) {
      console.error('❌ Failed to load API configuration:', error);
      apiKeyPromise = null; // Reset promise on error to allow retry
      throw error;
    }
  })();

  return apiKeyPromise;
}

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number>;
}

/**
 * Authenticated fetch wrapper that automatically adds API Key header
 * @param url - API endpoint (relative or absolute)
 * @param options - Fetch options
 * @returns Promise with response
 */
export async function apiClient<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query params if provided
  let finalUrl = url;
  if (params) {
    const queryString = new URLSearchParams(
      Object.entries(params).map(([key, value]) => [key, String(value)])
    ).toString();
    finalUrl = `${url}?${queryString}`;
  }

  // Get API key (will fetch from config if not already loaded)
  const apiKey = await getApiKey();

  // Merge headers with API Key
  const headers = new Headers(fetchOptions.headers);
  if (apiKey) {
    headers.set('X-API-Key', apiKey);
  }
  headers.set('Content-Type', 'application/json');

  const response = await fetch(finalUrl, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage: string;

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || response.statusText;
    } catch {
      errorMessage = errorText || response.statusText;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = any>(url: string, options?: FetchOptions) =>
    apiClient<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, data?: any, options?: FetchOptions) =>
    apiClient<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(url: string, data?: any, options?: FetchOptions) =>
    apiClient<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(url: string, options?: FetchOptions) =>
    apiClient<T>(url, { ...options, method: 'DELETE' }),

  patch: <T = any>(url: string, data?: any, options?: FetchOptions) =>
    apiClient<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
};
