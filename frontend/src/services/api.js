import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const isDev = import.meta.env.DEV;

if (isDev) {
  console.log('API Base URL:', API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

const normalizeApiError = (error, fallbackMessage) => {
  const status = error?.response?.status;
  const backendMessage = error?.response?.data?.message;
  const rawMessage = backendMessage || error?.message || '';
  const isGatewayIssue = status === 502 || /502|bad gateway|cloudflare/i.test(rawMessage);
  const isTimeout = error?.code === 'ECONNABORTED' || /timeout/i.test(rawMessage);

  const normalized = new Error(
    isTimeout
      ? 'Request timed out. The server may be waking up — please try again in a moment.'
      : isGatewayIssue
      ? 'Service is temporarily unavailable. Please try again in a moment.'
      : (backendMessage || fallbackMessage)
  );

  normalized.status = status;
  normalized.isUpstream502 = isGatewayIssue;
  normalized.isTimeout = isTimeout;
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

export const kanbanService = {
  // Boards
  getBoards:   ()             => api.get('/kanban/boards'),
  createBoard: (data)         => api.post('/kanban/boards', data),
  getBoard:    (boardId)      => api.get(`/kanban/boards/${boardId}`),
  updateBoard: (boardId, data) => api.put(`/kanban/boards/${boardId}`, data),
  deleteBoard: (boardId)      => api.delete(`/kanban/boards/${boardId}`),

  // Columns
  createColumn:   (boardId, data) => api.post(`/kanban/boards/${boardId}/columns`, data),
  updateColumn:   (columnId, data) => api.put(`/kanban/columns/${columnId}`, data),
  deleteColumn:   (columnId)      => api.delete(`/kanban/columns/${columnId}`),
  reorderColumns: (columns)       => api.post('/kanban/columns/reorder', { columns }),

  // Tickets
  createTicket:  (boardId, data) => api.post(`/kanban/boards/${boardId}/tickets`, data),
  getTicket:     (ticketId)      => api.get(`/kanban/tickets/${ticketId}`),
  updateTicket:  (ticketId, data) => api.put(`/kanban/tickets/${ticketId}`, data),
  archiveTicket: (ticketId)      => api.patch(`/kanban/tickets/${ticketId}/archive`),
  moveTicket:    (ticketId, data) => api.patch(`/kanban/tickets/${ticketId}/move`, data),
  getCalendarTickets: (params)   => api.get('/kanban/tickets/calendar', { params }),

  // Assignees
  addAssignee:    (ticketId, userId) => api.post(`/kanban/tickets/${ticketId}/assignees`, { user_id: userId }),
  removeAssignee: (ticketId, userId) => api.delete(`/kanban/tickets/${ticketId}/assignees/${userId}`),

  // Labels
  getLabels:           (boardId)          => api.get(`/kanban/boards/${boardId}/labels`),
  createLabel:         (boardId, data)    => api.post(`/kanban/boards/${boardId}/labels`, data),
  updateLabel:         (labelId, data)    => api.put(`/kanban/labels/${labelId}`, data),
  deleteLabel:         (labelId)          => api.delete(`/kanban/labels/${labelId}`),
  addLabelToTicket:    (ticketId, labelId) => api.post(`/kanban/tickets/${ticketId}/labels`, { label_id: labelId }),
  removeLabelFromTicket: (ticketId, labelId) => api.delete(`/kanban/tickets/${ticketId}/labels/${labelId}`),

  // Tasks
  createTask: (ticketId, title) => api.post(`/kanban/tickets/${ticketId}/tasks`, { title }),
  updateTask: (taskId, data)    => api.put(`/kanban/tasks/${taskId}`, data),
  deleteTask: (taskId)          => api.delete(`/kanban/tasks/${taskId}`),

  // Attachments
  addAttachment:    (ticketId, data)     => api.post(`/kanban/tickets/${ticketId}/attachments`, data),
  deleteAttachment: (attachmentId)       => api.delete(`/kanban/attachments/${attachmentId}`),

  // Comments
  getComments:    (ticketId)       => api.get(`/kanban/tickets/${ticketId}/comments`),
  createComment:  (ticketId, body) => api.post(`/kanban/tickets/${ticketId}/comments`, { body }),
  updateComment:  (commentId, body) => api.put(`/kanban/comments/${commentId}`, { body }),
  deleteComment:  (commentId)      => api.delete(`/kanban/comments/${commentId}`),

  // Users (assignee picker)
  getUsers: () => api.get('/kanban/users')
};

export const emailsCrmService = {
  getSmes: () => api.get('/emails-crm/smes'),
  getPointPeople: () => api.get('/emails-crm/point-people'),
  createSme: (payload) => api.post('/emails-crm/smes', payload),
  updateSme: (id, payload) => api.put(`/emails-crm/smes/${id}`, payload),
  deleteSme: (id) => api.delete(`/emails-crm/smes/${id}`),

  getTemplates: () => api.get('/emails-crm/templates'),
  createTemplate: (payload) => api.post('/emails-crm/templates', payload),
  updateTemplate: (id, payload) => api.put(`/emails-crm/templates/${id}`, payload),
  deleteTemplate: (id) => api.delete(`/emails-crm/templates/${id}`),

  getSmeLogs: (smeId) => api.get(`/emails-crm/smes/${smeId}/logs`),
  createSmeLog: (smeId, payload) => api.post(`/emails-crm/smes/${smeId}/logs`, payload),
  updateSmeLog: (logId, payload) => api.put(`/emails-crm/sme-logs/${logId}`, payload),
  deleteSmeLog: (logId) => api.delete(`/emails-crm/sme-logs/${logId}`)
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
