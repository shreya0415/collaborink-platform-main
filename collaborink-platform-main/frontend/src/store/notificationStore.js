import { create } from 'zustand';
import api from '../services/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchUnreadCount: async () => {
    try {
      const res = await api.get('/notifications/count');
      set({ unreadCount: res.data.unreadCount ?? res.data.count ?? 0 });
    } catch {}
  },

  fetchNotifications: async ({ page = 1, unread = false, type = '' } = {}) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams({ page });
      if (unread) params.set('unread', 'true');
      if (type) params.set('type', type);
      const res = await api.get(`/notifications?${params}`);
      set({ notifications: res.data.notifications, isLoading: false });
      return res.data;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}`);
      set(state => ({
        notifications: state.notifications.map(n =>
          n._id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {}
  },

  markAllAsRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {}
  },

  deleteNotification: async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      const n = get().notifications.find(n => n._id === notificationId);
      set(state => ({
        notifications: state.notifications.filter(n => n._id !== notificationId),
        unreadCount: n && !n.isRead ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      }));
    } catch {}
  },

  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));
