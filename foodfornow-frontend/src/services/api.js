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

// Global response interceptor to handle auth token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    if (response && response.status === 401 && !config._retry) {
      config._retry = true;
      try {
        await api.post('/auth/token');
        return api(config);
      } catch (refreshError) {
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