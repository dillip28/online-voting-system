import { apiClient } from './client';
import type { ApiResponse, User } from '@/types';

interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  studentId?: string;
}

interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  avatar?: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<ApiResponse<LoginResponse>>('/auth/login', { email, password });
  },

  async register(data: RegisterData): Promise<ApiResponse<{ user: User; message: string }>> {
    return apiClient.post('/auth/register', data);
  },

  async logout(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/auth/logout');
  },

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/auth/reset-password', { token, password });
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get('/auth/me');
  },

  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<User>> {
    return apiClient.put('/auth/profile', data);
  },

  async changePassword(data: ChangePasswordData): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/auth/change-password', data);
  },
};
