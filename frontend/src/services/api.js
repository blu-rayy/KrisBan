import axios from 'axios';

const isProduction = window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction 
  ? 'https://krisban-backend.onrender.com/api'
  : 'http://localhost:5000/api';

console.log('Environment:', isProduction ? 'Production' : 'Development');
console.log('API Base URL:', API_BASE_URL);

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

// Add response interceptor for better error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: (studentNumber, password, name, username, email, instituteEmail, personalEmail, birthday) =>
    api.post('/auth/register', { studentNumber, password, name, username, email, instituteEmail, personalEmail, birthday }),

  login: (studentNumber, password) =>
    api.post('/auth/login', { studentNumber, password }),

  changePassword: (newPassword, confirmPassword) =>
    api.post('/auth/change-password', { newPassword, confirmPassword }),

  getMe: () =>
    api.get('/auth/me'),

  updateProfile: (profileData) =>
    api.put('/auth/profile', profileData)
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
