import { create } from 'zustand';

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

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ notifications: [], unreadCount: 0, isLoading: false });
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
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, readStatus: true } : n
      );
      return {
        notifications: updated,
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });
  },

  markAllAsRead: async () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, readStatus: true }));
      return {
        notifications: updated,
        unreadCount: 0,
      };
    });
  },
}));
