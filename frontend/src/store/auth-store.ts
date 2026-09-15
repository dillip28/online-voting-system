import { create } from 'zustand';
import type { User, UserRole } from '@/types';

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  studentId: string;
  department: string;
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

interface DemoAccount {
  password: string;
  role: UserRole;
  fullName: string;
  studentId: string;
  department: string;
}

const DEMO_ACCOUNTS: Record<string, DemoAccount> = {
  'voter@test.com': {
    password: 'password123',
    role: 'voter',
    fullName: 'Alex Johnson',
    studentId: 'STU-2024-0892',
    department: 'Computer Science',
  },
  'admin@test.com': {
    password: 'password123',
    role: 'admin',
    fullName: 'Sarah Williams',
    studentId: 'STU-2024-0001',
    department: 'Administration',
  },
  'superadmin@test.com': {
    password: 'password123',
    role: 'super_admin',
    fullName: 'David Admin',
    studentId: 'STU-2024-0000',
    department: 'Administration',
  },
};

const createUser = (
  email: string,
  account: Pick<DemoAccount, 'role' | 'fullName' | 'studentId' | 'department'>,
  phone?: string
): User => {
  const timestamp = new Date().toISOString();
  return {
    id: `local_${email.replace(/[^a-z0-9]/gi, '_')}`,
    email,
    fullName: account.fullName,
    phone,
    studentId: account.studentId,
    role: account.role,
    isVerified: true,
    isActive: true,
    twoFactorEnabled: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

const getStoredAuth = (): { token: string | null; user: User | null } => {
  try {
    const token = localStorage.getItem('auth_token');
    const userRaw = localStorage.getItem('auth_user');
    return { token, user: userRaw ? (JSON.parse(userRaw) as User) : null };
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

  login: async (email, password) => {
    set({ isLoading: true });
    const normalizedEmail = email.trim().toLowerCase();
    const account = DEMO_ACCOUNTS[normalizedEmail];
    if (!account || account.password !== password) {
      set({ isLoading: false });
      return false;
    }

    const user = createUser(normalizedEmail, account);
    const token = `local_token_${user.id}`;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
    return true;
  },

  logout: async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  register: async (data) => {
    set({ isLoading: true });
    const email = data.email.trim().toLowerCase();
    const user = createUser(email, {
      role: 'voter',
      fullName: data.fullName.trim(),
      studentId: data.studentId.trim(),
      department: data.department.trim(),
    }, data.phone.trim() || undefined);
    const token = `local_token_${user.id}`;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
    return true;
  },

  setUser: (user) => {
    if (user) localStorage.setItem('auth_user', JSON.stringify(user));
    else localStorage.removeItem('auth_user');
    set({ user, isAuthenticated: Boolean(user && get().token) });
  },

  setToken: (token) => {
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
    set({ token, isAuthenticated: Boolean(token && get().user) });
  },

  clearAuth: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
}));
