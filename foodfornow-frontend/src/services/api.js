import axios from 'axios';

/**
 * API Service Configuration
 * 
 * This module configures the axios HTTP client for communicating with the backend API.
 * It includes automatic token refresh, request/response interceptors, and error handling.
 */

// Configure the backend API URL
// Use environment variable to configure the backend API URL. During
// development the value from `.env` will be used and in production the
// variable can be provided at build time. Fallback to `/api` so the
// frontend can be served from the same host as the backend when behind a
// reverse proxy.
const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Axios Instance Configuration
 * 
 * Creates a configured axios instance with:
 * - Base URL for API endpoints
 * - Credentials enabled for cookie-based authentication
 */
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies with requests for authentication
});

/**
 * Request Interceptor
 * 
 * Automatically sets Content-Type header for requests that send data.
 * Only applies Content-Type for POST, PUT, and PATCH requests.
 */
api.interceptors.request.use((config) => {
  const method = config.method ? config.method.toLowerCase() : '';
  
  // Set Content-Type for requests that send data
  if (['post', 'put', 'patch'].includes(method)) {
    config.headers = {
      ...config.headers,
      'Content-Type': 'application/json',
    };
  } else if (config.headers) {
    // Remove Content-Type for GET requests to avoid CORS preflight
    delete config.headers['Content-Type'];
  }
  return config;
});

/**
 * Token Refresh State Management
 * 
 * Prevents multiple simultaneous token refresh attempts and queues
 * requests that fail due to expired tokens.
 */
// Flag to prevent multiple refresh attempts
let isRefreshing = false;
// Queue of requests waiting for token refresh
let refreshSubscribers = [];

/**
 * Execute Queued Requests
 * 
 * Called after successful token refresh to retry all queued requests.
 */
function onRefreshed() {
  refreshSubscribers.forEach((callback) => callback());
  refreshSubscribers = [];
}

/**
 * Response Interceptor - Automatic Token Refresh
 * 
 * Handles 401 (Unauthorized) responses by automatically refreshing
 * the access token and retrying the original request.
 * Queues multiple requests during refresh to prevent race conditions.
 */
api.interceptors.response.use(
  // Success handler - pass through successful responses
  (response) => response,
  
  // Error handler - handle authentication errors
  async (error) => {
    const { response, config } = error;
    
    // Check if this is a 401 error and we haven't already retried
    if (response && response.status === 401 && !config._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          refreshSubscribers.push(() => {
            config._retry = true;
            api(config).then(resolve).catch(reject);
          });
        });
      }
      
      // Mark this request as retried and start refresh process
      config._retry = true;
      isRefreshing = true;
      
      try {
        // Attempt to refresh the access token
        await api.post('/auth/token');
        isRefreshing = false;
        onRefreshed(); // Retry all queued requests
        
        // Retry the original request with new token
        return api(config);
      } catch (refreshError) {
        // Token refresh failed - clear state and redirect to login
        isRefreshing = false;
        refreshSubscribers = [];
        
        // Redirect to login page if in browser environment
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    // For non-401 errors, just reject the promise
    return Promise.reject(error);
  }
);

// Export the configured axios instance
export default api;