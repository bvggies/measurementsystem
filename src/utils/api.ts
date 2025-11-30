/**
 * API configuration and axios setup
 */

import axios from 'axios';

// Configure axios base URL
// In production (Vercel), API routes are at the same origin, so empty string is fine
// In development, can use REACT_APP_API_URL if needed
const API_URL = process.env.REACT_APP_API_URL || '';

if (API_URL) {
  axios.defaults.baseURL = API_URL;
}
// If no API_URL, axios will use relative paths (same origin)

// Add request interceptor to include auth token and cache-busting
axios.interceptors.request.use(
  (config) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      // localStorage not available, continue without token
    }
    
    // Add cache-busting to API requests
    if (config.url && config.url.startsWith('/api/')) {
      const separator = config.url.includes('?') ? '&' : '?';
      config.url = `${config.url}${separator}_t=${Date.now()}`;
    }
    
    // Ensure API requests are not cached
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect to login
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (e) {
        // localStorage not available
      }
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axios;

