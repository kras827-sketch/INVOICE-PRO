import axios from 'axios';

const isProduction = import.meta.env.MODE === 'production';

// In production: use backend API URL or fallback
// In development: use VITE_API_URL environment variable (default http://localhost:5000)
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In production (or when no VITE_API_URL), use relative path to allow Vercel properties to handle routing
  // But if we are clearly in dev (localhost), default to localhost:5000 if not specified
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  // Production fallback: relative path (assumes same domain hosting)
  return '';
};

const apiBaseUrl = getBaseUrl();

// Ensure the baseURL always ends properly for appending paths
// If apiBaseUrl is empty (relative), we just use '/api'
const baseURL = apiBaseUrl 
  ? (apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`)
  : '/api';

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