import { apiClient } from './client';
import type { ApiResponse, Notification } from '@/types';

export const notificationsApi = {
  async getNotifications(filters?: { isRead?: boolean; type?: string; page?: number; limit?: number }): Promise<ApiResponse<{ data: Notification[]; total: number; unreadCount: number }>> {
    return apiClient.get('/notifications', { params: filters as Record<string, string | number | boolean | undefined> });
  },

  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch('/notifications/read-all');
  },

  async deleteNotification(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/notifications/${id}`);
  },
};
