import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const isDev = import.meta.env.DEV;

if (isDev) {
  console.log('API Base URL:', API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL
});

const normalizeApiError = (error, fallbackMessage) => {
  const status = error?.response?.status;
  const backendMessage = error?.response?.data?.message;
  const rawMessage = backendMessage || error?.message || '';
  const isGatewayIssue = status === 502 || /502|bad gateway|cloudflare/i.test(rawMessage);

  const normalized = new Error(
    isGatewayIssue ? 'Service is temporarily unavailable. Please try again in a moment.' : (backendMessage || fallbackMessage)
  );

  normalized.status = status;
  normalized.isUpstream502 = isGatewayIssue;
  return normalized;
};

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
    if (isDev) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message
      });
    }
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
    api.get('/progress-reports/stats/summary'),

  getLastWeekProgressStats: () =>
    api.get('/progress-reports/stats/last-week')
};

export const weeklyReportService = {
  list: () => api.get('/weekly-reports'),
  getByWeek: (reportWeek) => api.get(`/weekly-reports/${reportWeek}`),
  generateDraft: (payload) => api.post('/weekly-reports/generate', payload),
  saveDraft: (reportWeek, payload) => api.post(`/weekly-reports/${reportWeek}/save`, payload),
  exportPdf: (reportWeek) =>
    api.post(`/weekly-reports/${reportWeek}/export-pdf`, {}, { responseType: 'blob' }),
  exportDocx: (reportWeek) =>
    api.post(`/weekly-reports/${reportWeek}/export-docx`, {}, { responseType: 'blob' })
};

export const emailsCrmService = {
  getSmes: () => api.get('/emails-crm/smes'),
  createSme: (payload) => api.post('/emails-crm/smes', payload),
  updateSme: (id, payload) => api.put(`/emails-crm/smes/${id}`, payload),
  deleteSme: (id) => api.delete(`/emails-crm/smes/${id}`),

  getTemplates: () => api.get('/emails-crm/templates'),
  createTemplate: (payload) => api.post('/emails-crm/templates', payload),
  updateTemplate: (id, payload) => api.put(`/emails-crm/templates/${id}`, payload),
  deleteTemplate: (id) => api.delete(`/emails-crm/templates/${id}`)
};

export const fetchProgressReports = async (filters = {}) => {
  try {
    const response = await dashboardService.getProgressReports(filters);
    return response?.data?.data || [];
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch progress reports');
  }
};

export const fetchRecentProgressReports = async () => {
  return fetchProgressReports({ limit: 3, sortBy: 'created_at', sortOrder: 'desc', includeImages: false });
};

export const fetchLastWeekProgressStats = async () => {
  try {
    const response = await dashboardService.getLastWeekProgressStats();
    return response?.data?.data || { startDate: null, endDate: null, days: [] };
  } catch (error) {
    throw normalizeApiError(error, 'Failed to fetch last week progress stats');
  }
};

export const fetchDashboardData = async () => {
  try {
    const response = await dashboardService.getDashboard();
    return response?.data?.data || { summary: {}, boards: [] };
  } catch (error) {
    throw normalizeApiError(error, 'Failed to load dashboard');
  }
};

export default api;
