import { create } from 'zustand';
import type { User } from '@/types';
import { authApi } from '@/api/auth';

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  studentId?: string;
  department?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<boolean>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

const getStoredAuth = (): { token: string | null; user: User | null } => {
  try {
    const token = localStorage.getItem('auth_token');
    const userRaw = localStorage.getItem('auth_user');
    const user = userRaw ? (JSON.parse(userRaw) as User) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

const { token: initialToken, user: initialUser } = getStoredAuth();

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: Boolean(initialToken && initialUser),
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login(email, password);
      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        const user: User = {
          id: userData.id,
          email: userData.email,
          fullName: userData.profile?.fullName || '',
          phone: undefined,
          studentId: userData.profile?.studentId,
          role: userData.role as any,
          avatar: undefined,
          isVerified: userData.profile?.isVerified || false,
          isActive: true,
          twoFactorEnabled: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true });
    try {
      const response = await authApi.register({
        email: data.email,
        password: data.password,
        profile: {
          fullName: data.fullName,
          studentId: data.studentId || '',
          department: data.department || 'General',
          phone: data.phone,
        },
      });
      if (response.success && response.data) {
        // Auto-login after registration
        const loginResponse = await authApi.login(data.email, data.password);
        if (loginResponse.success && loginResponse.data) {
          const { token, user: userData } = loginResponse.data;
          const user: User = {
            id: userData.id,
            email: userData.email,
            fullName: userData.profile?.fullName || '',
            phone: undefined,
            studentId: userData.profile?.studentId,
            role: userData.role as any,
            avatar: undefined,
            isVerified: userData.profile?.isVerified || false,
            isActive: true,
            twoFactorEnabled: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_user', JSON.stringify(user));
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }
        set({ isLoading: false });
        return false;
      }
      set({ isLoading: false });
      return false;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
    set({ user, isAuthenticated: Boolean(user && get().token) });
  },

  setToken: (token) => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
    set({ token, isAuthenticated: Boolean(token && get().user) });
  },

  clearAuth: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
