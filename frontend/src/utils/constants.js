/**
 * Application constants
 */

export const API_BASE_URL = 'http://localhost:8000';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  IS_ADMIN: 'is_admin',
  CURRENT_USERNAME: 'current_username',
};

export const API_ENDPOINTS = {
  LOGIN: '/api/login',
  LOGOUT: '/api/logout',
  REGISTER: '/api/register',
  DASHBOARD: '/api/dashboard',
  USERS: '/api/users',
  CLEAR_CACHE: '/api/clear-cache',
  HEALTH: '/api/health',
  STATUS_LINKS: '/api/status/links',
  STATUS_PING: '/api/status/ping',
};

export const ROUTES = {
  LANDING: 'landing',
  LOGIN: 'login',
  ADMIN: 'admin',
  DASHBOARD: 'dashboard',
};
