import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies with requests
});

// Add request interceptor to set Content-Type only when needed
api.interceptors.request.use((config) => {
  const method = config.method ? config.method.toLowerCase() : '';
  if (['post', 'put', 'patch'].includes(method)) {
    config.headers = {
      ...config.headers,
      'Content-Type': 'application/json',
    };
  } else if (config.headers) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed() {
  refreshSubscribers.forEach((callback) => callback());
  refreshSubscribers = [];
}

// Global response interceptor to handle auth token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    if (response && response.status === 401 && !config._retry) {
      if (isRefreshing) {
        // Queue the request until the refresh is done
        return new Promise((resolve, reject) => {
          refreshSubscribers.push(() => {
            config._retry = true;
            api(config).then(resolve).catch(reject);
          });
        });
      }
      config._retry = true;
      isRefreshing = true;
      try {
        await api.post('/auth/token');
        isRefreshing = false;
        onRefreshed();
        return api(config);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;