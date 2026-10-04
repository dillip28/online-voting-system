import { create } from 'zustand';
import type { User, UserRole } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

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
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<boolean>;
  setUser: (user: User | null) => void;
  clearAuth: () => void;
  initAuth: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

interface ProfileRow {
  id: string;
  role: 'admin' | 'voter';
  name: string;
  email: string;
  created_at: string;
}

const profileToUser = (profile: ProfileRow): User => ({
  id: profile.id,
  email: profile.email,
  fullName: profile.name,
  role: profile.role as UserRole,
  isVerified: true,
  isActive: true,
  twoFactorEnabled: false,
  createdAt: profile.created_at,
  updatedAt: profile.created_at,
});

async function fetchOrCreateProfile(session: Session): Promise<ProfileRow | null> {
  const authUser = session.user;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) {
    console.error('[auth] Failed to load profile:', error.message);
    return null;
  }
  if (data) return data as ProfileRow;

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: authUser.id,
      email: authUser.email ?? '',
      name: (authUser.user_metadata?.full_name as string) || authUser.email?.split('@')[0] || 'User',
      role: 'voter',
    })
    .select()
    .single();

  if (insertError) {
    console.error('[auth] Failed to create profile:', insertError.message);
    return null;
  }
  return created as ProfileRow;
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initAuth: async () => {
    if (!isSupabaseConfigured) {
      set({ isLoading: false, error: 'Supabase is not configured.' });
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const profile = await fetchOrCreateProfile(session);
        set({
          user: profile ? profileToUser(profile) : null,
          token: session.access_token,
          isAuthenticated: Boolean(profile),
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
          const profile = await fetchOrCreateProfile(session);
          set({
            user: profile ? profileToUser(profile) : null,
            token: session.access_token,
            isAuthenticated: Boolean(profile),
          });
        } else {
          set({ user: null, token: null, isAuthenticated: false });
        }
      });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Auth init failed' });
    }
  },

  login: async (email, password) => {
    if (!isSupabaseConfigured) {
      set({ error: 'Supabase is not configured.' });
      return false;
    }
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error || !data.session) {
      set({ isLoading: false, error: error?.message ?? 'Login failed' });
      return false;
    }
    const profile = await fetchOrCreateProfile(data.session);
    set({
      user: profile ? profileToUser(profile) : null,
      token: data.session.access_token,
      isAuthenticated: Boolean(profile),
      isLoading: false,
      error: profile ? null : 'Profile not found. Please contact support.',
    });
    return Boolean(profile);
  },

  register: async (data) => {
    if (!isSupabaseConfigured) {
      set({ error: 'Supabase is not configured.' });
      return false;
    }
    set({ isLoading: true, error: null });
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: { data: { full_name: data.fullName.trim() } },
    });
    if (error) {
      set({ isLoading: false, error: error.message });
      return false;
    }
    if (signUpData.session) {
      const profile = await fetchOrCreateProfile(signUpData.session);
      set({
        user: profile ? profileToUser(profile) : null,
        token: signUpData.session.access_token,
        isAuthenticated: Boolean(profile),
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
    return true;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: Boolean(user && get().token) });
  },

  clearAuth: () => {
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
}));
