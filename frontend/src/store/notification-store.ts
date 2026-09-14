import { create } from 'zustand';
import type { Notification } from '@/types';
import { mockNotifications } from '@/mocks/notifications';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
}

interface NotificationActions {
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
}

type NotificationStore = NotificationState & NotificationActions;

const computeUnread = (list: Notification[]) =>
  list.filter((n) => !n.isRead).length;

export const useNotificationStore = create<NotificationStore>()((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    const notifications = [...mockNotifications];
    set({
      notifications,
      unreadCount: computeUnread(notifications),
      isLoading: false,
    });
  },

  markAsRead: (id: string) => {
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      return {
        notifications,
        unreadCount: computeUnread(notifications),
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const notifications = [newNotification, ...state.notifications];
      return {
        notifications,
        unreadCount: computeUnread(notifications),
      };
    });
  },
}));
