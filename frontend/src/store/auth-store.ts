import { create } from 'zustand';
import type { User } from '@/types';
import { mockUsers } from '@/mocks/users';

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  studentId?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
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

const mockCredentials: Record<string, { email: string; password: string }> = {
  voter: { email: 'voter@test.com', password: 'password123' },
  admin: { email: 'admin@test.com', password: 'password123' },
  super_admin: { email: 'superadmin@test.com', password: 'password123' },
};

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: Boolean(initialToken && initialUser),
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 800));

    const matched = mockUsers.find((u) => u.email === email);
    const validCred = Object.values(mockCredentials).find(
      (c) => c.email === email && c.password === password
    );

    if (matched && validCred) {
      const fakeToken = `token_${matched.id}_${Date.now()}`;
      localStorage.setItem('auth_token', fakeToken);
      localStorage.setItem('auth_user', JSON.stringify(matched));
      set({
        user: matched,
        token: fakeToken,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    }

    set({ isLoading: false });
    return false;
  },

  logout: () => {
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
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const exists = mockUsers.some((u) => u.email === data.email);
    if (exists) {
      set({ isLoading: false });
      return false;
    }

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

    mockUsers.push(newUser);
    const fakeToken = `token_${newUser.id}_${Date.now()}`;
    localStorage.setItem('auth_token', fakeToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));

    set({
      user: newUser,
      token: fakeToken,
      isAuthenticated: true,
      isLoading: false,
    });
    return true;
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
