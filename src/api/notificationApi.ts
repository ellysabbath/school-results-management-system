import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://resultmanagement.pythonanywhere.com/api';

const notificationApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
notificationApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const notificationService = {
  // Get all notifications
  getNotifications: async () => {
    const response = await notificationApi.get('/notifications/');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (id: number) => {
    const response = await notificationApi.put(`/notifications/${id}/read/`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await notificationApi.put('/notifications/mark-all-read/');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (id: number) => {
    const response = await notificationApi.delete(`/notifications/${id}/`);
    return response.data;
  },
};

export default notificationApi;