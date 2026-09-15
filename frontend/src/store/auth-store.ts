import { create } from 'zustand';
import type { User } from '@/types';

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

// Mock users for demo (no backend required)
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'voter@test.com': {
    password: 'password123',
    user: {
      id: 'usr_voter_001',
      email: 'voter@test.com',
      fullName: 'Alex Johnson',
      phone: '+1-555-0101',
      studentId: 'STU-2024-0892',
      role: 'voter',
      isVerified: true,
      isActive: true,
      twoFactorEnabled: false,
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
  },
  'admin@test.com': {
    password: 'password123',
    user: {
      id: 'usr_admin_001',
      email: 'admin@test.com',
      fullName: 'Sarah Williams',
      phone: '+1-555-0202',
      studentId: 'STU-2024-0001',
      role: 'admin',
      isVerified: true,
      isActive: true,
      twoFactorEnabled: false,
      createdAt: '2026-01-10T10:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
  },
  'superadmin@test.com': {
    password: 'password123',
    user: {
      id: 'usr_super_001',
      email: 'superadmin@test.com',
      fullName: 'David Admin',
      phone: '+1-555-0303',
      studentId: 'STU-2024-0000',
      role: 'super_admin',
      isVerified: true,
      isActive: true,
      twoFactorEnabled: false,
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
  },
};

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
      const mockEntry = MOCK_USERS[email.toLowerCase().trim()];
      if (!mockEntry || mockEntry.password !== password) {
        set({ isLoading: false });
        return false;
      }
      const user = mockEntry.user;
      const token = `mock_token_${user.id}`;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
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
      const newUser: User = {
        id: `usr_${Date.now()}`,
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        studentId: data.studentId,
        role: 'voter',
        isVerified: false,
        isActive: true,
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const token = `mock_token_${newUser.id}`;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      set({
        user: newUser,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
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
