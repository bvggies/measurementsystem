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

// Add request interceptor to include auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios;

