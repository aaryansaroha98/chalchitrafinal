import axios from 'axios';

// Configure axios base URL for production
// In development, use localhost:3000
// In production, use the Render backend URL
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 
  process.env.VITE_API_BASE_URL || 
  'https://chalchitra-api.onrender.com';

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default api;
