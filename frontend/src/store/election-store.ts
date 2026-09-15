import { create } from 'zustand';
import type { Election, Candidate } from '@/types';
import { electionsApi } from '@/api/elections';

interface ElectionState {
  elections: Election[];
  currentElection: Election | null;
  candidates: Candidate[];
  isLoading: boolean;
  error: string | null;
}

interface ElectionActions {
  fetchElections: (filters?: Record<string, unknown>) => Promise<void>;
  fetchElection: (id: string) => Promise<void>;
  fetchCandidates: (electionId: string) => Promise<void>;
  createElection: (data: Record<string, unknown>) => Promise<boolean>;
  updateElection: (id: string, data: Record<string, unknown>) => Promise<boolean>;
  openElection: (id: string) => Promise<boolean>;
  closeElection: (id: string) => Promise<boolean>;
  clearElection: () => void;
}

type ElectionStore = ElectionState & ElectionActions;

export const useElectionStore = create<ElectionStore>()((set) => ({
  elections: [],
  currentElection: null,
  candidates: [],
  isLoading: false,
  error: null,

  fetchElections: async (filters?: Record<string, unknown>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await electionsApi.getElections(filters);
      if (response.success && response.data) {
        const data = response.data as any;
        const items = data.items || data.data || data;
        set({
          elections: Array.isArray(items) ? items : [],
          isLoading: false,
        });
      } else {
        set({ isLoading: false, error: 'Failed to fetch elections' });
      }
    } catch {
      set({ isLoading: false, error: 'Failed to fetch elections' });
    }
  },

  fetchElection: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await electionsApi.getElection(id);
      if (response.success && response.data) {
        set({
          currentElection: response.data,
          isLoading: false,
        });
      } else {
        set({ isLoading: false, error: 'Election not found' });
      }
    } catch {
      set({ isLoading: false, error: 'Election not found' });
    }
  },

  fetchCandidates: async (electionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await electionsApi.getElectionCandidates(electionId);
      if (response.success && response.data) {
        set({
          candidates: Array.isArray(response.data) ? response.data : [],
          isLoading: false,
        });
      } else {
        set({ isLoading: false, candidates: [] });
      }
    } catch {
      set({ isLoading: false, candidates: [] });
    }
  },

  createElection: async (data: Record<string, unknown>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await electionsApi.createElection(data as any);
      if (response.success) {
        set({ isLoading: false });
        return true;
      }
      set({ isLoading: false, error: 'Failed to create election' });
      return false;
    } catch {
      set({ isLoading: false, error: 'Failed to create election' });
      return false;
    }
  },

  updateElection: async (id: string, data: Record<string, unknown>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await electionsApi.updateElection(id, data as any);
      if (response.success) {
        set({ isLoading: false });
        return true;
      }
      set({ isLoading: false, error: 'Failed to update election' });
      return false;
    } catch {
      set({ isLoading: false, error: 'Failed to update election' });
      return false;
    }
  },

  openElection: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/elections/${id}/open`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        set({ isLoading: false });
        return true;
      }
      set({ isLoading: false, error: 'Failed to open election' });
      return false;
    } catch {
      set({ isLoading: false, error: 'Failed to open election' });
      return false;
    }
  },

  closeElection: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/elections/${id}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        set({ isLoading: false });
        return true;
      }
      set({ isLoading: false, error: 'Failed to close election' });
      return false;
    } catch {
      set({ isLoading: false, error: 'Failed to close election' });
      return false;
    }
  },

  clearElection: () => {
    set({
      currentElection: null,
      candidates: [],
      error: null,
    });
  },
}));
