/**
 * API Client with automatic API Key authentication
 * All requests automatically include the X-API-Key header
 * API Key is fetched from /config/public endpoint
 */

let API_KEY: string | null = null;
let apiKeyPromise: Promise<string> | null = null;

// Fetch API key from backend config endpoint
// Uses a shared promise to prevent multiple parallel requests
async function getApiKey(): Promise<string> {
  // Return cached key if available
  if (API_KEY) return API_KEY;

  // Return existing promise if a fetch is already in progress
  if (apiKeyPromise) return apiKeyPromise;

  // Create new promise for fetching API key
  apiKeyPromise = (async () => {
    try {
      const response = await fetch('/config/public');
      if (!response.ok) {
        throw new Error('Failed to fetch API configuration');
      }
      const config = await response.json();
      API_KEY = config.apiKey;

      if (!API_KEY) {
        console.error('API Key not found in configuration');
        throw new Error('API Key not found in configuration');
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
