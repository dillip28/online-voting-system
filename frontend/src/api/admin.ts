import { apiClient } from './client';
import type { Admin, ApiResponse, AuditLog, DashboardStats, PaginatedResponse, SystemSettings } from '@/types';

interface AuditLogFilters {
  action?: string;
  userId?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface CreateAdminData {
  email: string;
  fullName: string;
  role: 'admin' | 'super_admin';
  password: string;
}

interface UpdateAdminData {
  fullName?: string;
  role?: 'admin' | 'super_admin';
  is_active?: boolean;
}

export const adminApi = {
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return apiClient.get('/admin/dashboard/stats');
  },

  async getAuditLogs(filters?: AuditLogFilters): Promise<ApiResponse<PaginatedResponse<AuditLog>>> {
    return apiClient.get('/admin/audit-logs', { params: filters as Record<string, string | number | boolean | undefined> });
  },

  async getSystemSettings(): Promise<ApiResponse<SystemSettings>> {
    return apiClient.get('/admin/settings');
  },

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<ApiResponse<SystemSettings>> {
    return apiClient.put('/admin/settings', settings);
  },

  async getAdmins(): Promise<ApiResponse<Admin[]>> {
    return apiClient.get('/admin/admins');
  },

  async createAdmin(data: CreateAdminData): Promise<ApiResponse<Admin>> {
    return apiClient.post('/admin/admins', data);
  },

  async updateAdmin(id: string, data: UpdateAdminData): Promise<ApiResponse<Admin>> {
    return apiClient.put(`/admin/admins/${id}`, data);
  },

  async deleteAdmin(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/admin/admins/${id}`);
  },
};
