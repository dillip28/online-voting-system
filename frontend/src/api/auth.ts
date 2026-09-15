import { apiClient } from './client';
import type { ApiResponse, User, UserRole } from '@/types';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    profile: {
      fullName: string;
      studentId: string;
      department: string;
      isVerified: boolean;
    } | null;
  };
}

interface RegisterData {
  email: string;
  password: string;
  profile: {
    fullName: string;
    studentId: string;
    department: string;
    yearOfStudy?: number;
    phone?: string;
  };
}

interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  department?: string;
  yearOfStudy?: number;
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
    return apiClient.post('/auth/register', {
      email: data.email,
      password: data.password,
      role: 'voter',
      profile: data.profile,
    });
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
