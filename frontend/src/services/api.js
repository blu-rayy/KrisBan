import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const authService = {
  register: (email, password, name) =>
    api.post('/auth/register', { email, password, name }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  changePassword: (newPassword, confirmPassword) =>
    api.post('/auth/change-password', { newPassword, confirmPassword }),

  getMe: () =>
    api.get('/auth/me')
};

// Dashboard services
export const dashboardService = {
  getDashboard: () =>
    api.get('/dashboard'),

  getProgressReport: () =>
    api.get('/dashboard/admin/progress-report'),

  // Progress Reports CRUD
  getProgressReports: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/progress-reports${params ? '?' + params : ''}`);
  },

  getProgressReportById: (id) =>
    api.get(`/progress-reports/${id}`),

  createProgressReport: (data) =>
    api.post('/progress-reports', data),

  updateProgressReport: (id, data) =>
    api.put(`/progress-reports/${id}`, data),

  deleteProgressReport: (id) =>
    api.delete(`/progress-reports/${id}`),

  getProgressReportSummary: () =>
    api.get('/progress-reports/stats/summary')
};

export default api;
