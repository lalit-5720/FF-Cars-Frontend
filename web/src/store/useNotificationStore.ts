import { create } from 'zustand';
import { api } from '../services/api';

export interface NotificationItem {
  id: string;
  userId: string;
  message: string;
  readStatus: boolean;
  createdAt: string;
}

interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: NotificationItem) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get('/notifications');
      const notifications = response.data;
      const unreadCount = notifications.filter((n: NotificationItem) => !n.readStatus).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      set({ isLoading: false });
    }
  },

  addNotification: (notification) => {
    set((state) => {
      const updated = [notification, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: state.unreadCount + (notification.readStatus ? 0 : 1),
      };
    });
  },

  markAsRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === id ? { ...n, readStatus: true } : n
        );
        return {
          notifications: updated,
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      });
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set((state) => {
        const updated = state.notifications.map((n) => ({ ...n, readStatus: true }));
        return {
          notifications: updated,
          unreadCount: 0,
        };
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  },
}));
