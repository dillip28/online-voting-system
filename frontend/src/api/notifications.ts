import { apiClient } from './client';
import type { ApiResponse, Notification } from '@/types';

export const notificationsApi = {
  async getNotifications(filters?: { unreadOnly?: boolean; page?: number; limit?: number }): Promise<ApiResponse<{
    items: Notification[];
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    return apiClient.get('/notifications', { params: filters as Record<string, string | number | boolean | undefined> });
  },

  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<ApiResponse<{ markedCount: number }>> {
    return apiClient.patch('/notifications/read-all');
  },

  async deleteNotification(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/notifications/${id}`);
  },
};
