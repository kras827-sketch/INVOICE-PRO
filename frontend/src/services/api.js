import axios from 'axios';

const isProduction = import.meta.env.MODE === 'production';

// In production: use /api (relative path for same-origin requests)
// In development: use VITE_API_URL environment variable (default http://localhost:5000)
const apiBaseUrl = isProduction 
  ? '/api' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

// Ensure the baseURL always ends properly for appending paths
const baseURL = apiBaseUrl.endsWith('/api') || apiBaseUrl.endsWith('/') 
  ? apiBaseUrl 
  : apiBaseUrl + '/api';

console.log('🔗 API Base URL:', baseURL, 'Mode:', import.meta.env.MODE, 'Production:', isProduction);

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Log full error for debugging
    console.error('🔴 API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url,
      method: error.config?.method,
      errorMessage: error.message
    });
    
    return Promise.reject(error);
  }
);

export default api;