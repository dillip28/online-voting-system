import { create } from 'zustand';
import type { Election, Candidate } from '@/types';
import { mockElections } from '@/mocks/elections';
import { mockCandidates } from '@/mocks/candidates';

interface ElectionState {
  elections: Election[];
  currentElection: Election | null;
  candidates: Candidate[];
  isLoading: boolean;
  error: string | null;
}

interface ElectionActions {
  fetchElections: () => Promise<void>;
  fetchElection: (id: string) => Promise<void>;
  fetchCandidates: (electionId: string) => Promise<void>;
  clearElection: () => void;
}

type ElectionStore = ElectionState & ElectionActions;

export const useElectionStore = create<ElectionStore>()((set) => ({
  elections: [],
  currentElection: null,
  candidates: [],
  isLoading: false,
  error: null,

  fetchElections: async () => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 600));
    set({
      elections: [...mockElections],
      isLoading: false,
    });
  },

  fetchElection: async (id: string) => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 400));
    const election = mockElections.find((e) => e.id === id) ?? null;
    set({
      currentElection: election,
      isLoading: false,
      error: election ? null : 'Election not found',
    });
  },

  fetchCandidates: async (electionId: string) => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 500));
    const filtered = mockCandidates.filter((c) => c.electionId === electionId);
    set({
      candidates: filtered,
      isLoading: false,
    });
  },

  clearElection: () => {
    set({
      currentElection: null,
      candidates: [],
      error: null,
    });
  },
}));
