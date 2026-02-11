import axios from 'axios';

// In production: use relative URLs (Vercel rewrites proxy /api/* to Render backend)
// In development: use localhost
const isProduction = process.env.NODE_ENV === 'production';
const apiBaseUrl = isProduction 
  ? '' // Empty = relative URLs, Vercel proxy handles routing to backend
  : (process.env.REACT_APP_API_URL || 'http://localhost:3000');

console.log('[Chalchitra] Environment:', process.env.NODE_ENV);
console.log('[Chalchitra] API Base URL:', apiBaseUrl || '(relative - using Vercel proxy)');

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default api;

