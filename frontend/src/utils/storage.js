/**
 * LocalStorage utility functions
 */
import { STORAGE_KEYS } from './constants';

export const storage = {
  // Auth token
  getToken: () => localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
  setToken: (token) => localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token),
  removeToken: () => localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),

  // Admin status
  getIsAdmin: () => localStorage.getItem(STORAGE_KEYS.IS_ADMIN) === 'true',
  setIsAdmin: (isAdmin) => localStorage.setItem(STORAGE_KEYS.IS_ADMIN, isAdmin),
  removeIsAdmin: () => localStorage.removeItem(STORAGE_KEYS.IS_ADMIN),

  // Current username
  getUsername: () => localStorage.getItem(STORAGE_KEYS.CURRENT_USERNAME),
  setUsername: (username) => localStorage.setItem(STORAGE_KEYS.CURRENT_USERNAME, username),
  removeUsername: () => localStorage.removeItem(STORAGE_KEYS.CURRENT_USERNAME),

  // Clear all
  clearAll: () => {
    storage.removeToken();
    storage.removeIsAdmin();
    storage.removeUsername();
  },

  // Get all session data
  getSession: () => ({
    token: storage.getToken(),
    isAdmin: storage.getIsAdmin(),
    username: storage.getUsername(),
  }),

  // Set all session data
  setSession: ({ token, isAdmin, username }) => {
    storage.setToken(token);
    storage.setIsAdmin(isAdmin);
    storage.setUsername(username);
  },
};
