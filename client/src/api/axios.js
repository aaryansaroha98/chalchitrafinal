import axios from 'axios';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Safari caches GET responses aggressively (heuristic caching) and can serve
// stale data — this made time-sensitive lists like upcoming movies appear
// inconsistently. Force every GET to bypass the browser cache: send no-cache
// request headers and append a cache-busting timestamp param.
api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (method === 'get') {
    config.headers = config.headers || {};
    config.headers['Cache-Control'] = 'no-cache';
    config.headers['Pragma'] = 'no-cache';
    config.params = { ...(config.params || {}), _t: Date.now() };
  }
  return config;
});

export default api;
