import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auditLogService = {
  /**
   * Get all audit logs with pagination and filters
   */
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/audit-logs', { params });
      return response.data;
    } catch (error) {
      console.error('Get audit logs error:', error);
      throw error;
    }
  },

  /**
   * Get audit logs for a specific user
   */
  getByUser: async (userId) => {
    try {
      const response = await api.get('/audit-logs/user', {
        params: { userId },
      });
      return response.data;
    } catch (error) {
      console.error('Get audit logs by user error:', error);
      throw error;
    }
  },

  /**
   * Delete an audit log permanently
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/audit-logs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete audit log error:', error);
      throw error;
    }
  },
};
