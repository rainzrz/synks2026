/**
 * API utility functions
 */
import { API_BASE_URL, API_ENDPOINTS } from './constants';

/**
 * Make API request with authorization
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Make authenticated API request
 */
async function authenticatedRequest(endpoint, token, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}

export const api = {
  // Auth endpoints
  login: (username, password) =>
    apiRequest(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: (token) =>
    authenticatedRequest(API_ENDPOINTS.LOGOUT, token, {
      method: 'POST',
    }),

  register: (username, password, wikiUrl, isAdmin = false) =>
    apiRequest(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        wiki_url: wikiUrl,
        is_admin: isAdmin,
      }),
    }),

  // Dashboard endpoints
  getDashboard: (token) =>
    authenticatedRequest(API_ENDPOINTS.DASHBOARD, token),

  getUserDashboard: (token, username) =>
    authenticatedRequest(`${API_ENDPOINTS.DASHBOARD}/${username}`, token),

  clearCache: (token) =>
    authenticatedRequest(API_ENDPOINTS.CLEAR_CACHE, token, {
      method: 'POST',
    }),

  // User management
  getUsers: (token) =>
    authenticatedRequest(API_ENDPOINTS.USERS, token),

  updateUser: (token, username, updates) =>
    authenticatedRequest(`${API_ENDPOINTS.USERS}/${username}`, token, {
      method: 'PUT',
      body: JSON.stringify({ username, ...updates }),
    }),

  deleteUser: (token, username) =>
    authenticatedRequest(`${API_ENDPOINTS.USERS}/${username}`, token, {
      method: 'DELETE',
    }),

  // Status monitoring
  getAllLinkStatuses: (token) =>
    authenticatedRequest(API_ENDPOINTS.STATUS_LINKS, token),

  getUserLinkStatuses: (token, username) =>
    authenticatedRequest(`${API_ENDPOINTS.STATUS_LINKS}/${username}`, token),

  pingLink: (token, linkId) =>
    authenticatedRequest(`${API_ENDPOINTS.STATUS_PING}/${linkId}`, token, {
      method: 'POST',
    }),

  // Health check
  healthCheck: () =>
    apiRequest(API_ENDPOINTS.HEALTH),
};
