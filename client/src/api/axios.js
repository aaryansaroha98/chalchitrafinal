import axios from 'axios';

// Configure axios base URL for localhost development
const apiBaseUrl = process.env.REACT_APP_API_URL || 
  process.env.REACT_APP_API_BASE_URL || 
  process.env.VITE_API_BASE_URL || 
  'http://localhost:3000';

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default api;

