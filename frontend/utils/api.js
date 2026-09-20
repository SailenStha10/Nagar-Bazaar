import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SERVER_ORIGIN = API_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_URL,
});

// Uploaded files are served from the backend origin (e.g. /uploads/x.png),
// not under /api, so build their absolute URL separately.
export const getFileUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${SERVER_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
};

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth endpoints report 401 for ordinary reasons (wrong password, unknown email) and
// should keep showing their own inline error rather than forcing a redirect.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register'];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => url.includes(path));
      const hadToken = Boolean(localStorage.getItem('token'));

      if (!isAuthEndpoint && hadToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        const loginPath = window.location.pathname.startsWith('/admin') ? '/admin' : '/login';
        if (window.location.pathname !== loginPath) {
          window.location.href = loginPath;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
