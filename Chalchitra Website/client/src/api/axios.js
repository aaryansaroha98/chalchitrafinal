import axios from 'axios';

// Configure axios base URL for localhost development
const apiBaseUrl = process.env.REACT_APP_API_URL || 
  process.env.REACT_APP_API_BASE_URL || 
  process.env.VITE_API_BASE_URL || 
  'http://localhost:3000';

// Debug: Log the API URL being used (remove in production after debugging)
console.log('[Chalchitra] API Base URL:', apiBaseUrl);
console.log('[Chalchitra] REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default api;

