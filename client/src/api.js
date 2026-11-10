const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = BASE_URL ? `${BASE_URL}/api` : '/api';

export const getAuthToken = () => localStorage.getItem('et_token');
export const setAuthToken = (token) => localStorage.setItem('et_token', token);
export const removeAuthToken = () => {
  localStorage.removeItem('et_token');
  localStorage.removeItem('et_user');
};

export const getStoredUser = () => {
  const raw = localStorage.getItem('et_user');
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  localStorage.setItem('et_user', JSON.stringify(user));
};

async function request(endpoint, options = {}) {
  // Enforce browser online status check
  if (!navigator.onLine) {
    throw new Error("You are currently offline. You won't be able to save or modify any expenses until your connection is restored.");
  }

  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeAuthToken();
    window.dispatchEvent(new Event('auth-expired'));
    throw new Error('Session expired. Please log in again.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Online / Health check
  checkHealth: () => request('/health'),

  // Auth
  googleAuth: (payload) => request('/auth/google', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getMe: () => request('/auth/me'),

  // Categories
  getCategories: () => request('/categories'),
  addCategory: (data) => request('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Expenses
  getRecentExpenses: () => request('/expenses/recent'),
  getExpenses: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    return request(`/expenses?${query.toString()}`);
  },
  getMonthlySummary: (year) => {
    const query = year ? `?year=${year}` : '';
    return request(`/expenses/monthly-summary${query}`);
  },
  createExpense: (data) => request('/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getExpense: (id) => request(`/expenses/${id}`),
  updateExpense: (id, data) => request(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteExpense: (id) => request(`/expenses/${id}`, {
    method: 'DELETE',
  }),
};

