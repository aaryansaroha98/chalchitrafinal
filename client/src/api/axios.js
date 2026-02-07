import axios from 'axios';

// Configure axios base URL for production
// In development, use localhost:3000
// In production, use the Render backend URL
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 
  process.env.VITE_API_BASE_URL || 
  (process.env.NODE_ENV === 'production' ? 'https://chalchitra-api.onrender.com' : 'http://localhost:3000');

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Network Error: Cannot reach API at', apiBaseUrl);
    }
    return Promise.reject(error);
  }
);

export default api;
