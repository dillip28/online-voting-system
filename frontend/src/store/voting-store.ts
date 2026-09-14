import { create } from 'zustand';
import type { Election, Vote } from '@/types';

type VotingStep = 'select' | 'review' | 'confirm' | 'success';

interface SubmissionResult {
  vote: Vote;
  confirmationId: string;
  submittedAt: string;
}

interface VotingState {
  selectedElection: Election | null;
  selections: Map<string, string>;
  currentStep: VotingStep;
  isSubmitting: boolean;
  submissionResult: SubmissionResult | null;
}

interface VotingActions {
  selectCandidate: (positionId: string, candidateId: string) => void;
  removeSelection: (positionId: string) => void;
  submitVote: () => Promise<boolean>;
  resetVoting: () => void;
  setStep: (step: VotingStep) => void;
  setSelectedElection: (election: Election | null) => void;
}

type VotingStore = VotingState & VotingActions;

export const useVotingStore = create<VotingStore>()((set, get) => ({
  selectedElection: null,
  selections: new Map<string, string>(),
  currentStep: 'select',
  isSubmitting: false,
  submissionResult: null,

  selectCandidate: (positionId: string, candidateId: string) => {
    set((state) => {
      const next = new Map(state.selections);
      next.set(positionId, candidateId);
      return { selections: next };
    });
  },

  removeSelection: (positionId: string) => {
    set((state) => {
      const next = new Map(state.selections);
      next.delete(positionId);
      return { selections: next };
    });
  },

  submitVote: async () => {
    const { selectedElection, selections } = get();
    if (!selectedElection || selections.size === 0) return false;

    set({ isSubmitting: true });
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const confirmationId = `VOTE-${selectedElection.id.slice(-4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const submissionResult: SubmissionResult = {
      vote: {
        id: `vote_${Date.now()}`,
        electionId: selectedElection.id,
        voterId: '',
        positionId: selections.keys().next().value ?? '',
        candidateId: selections.values().next().value ?? null,
        isNota: false,
        submittedAt: new Date().toISOString(),
        confirmationId,
        status: 'submitted',
      },
      confirmationId,
      submittedAt: new Date().toISOString(),
    };

    set({
      isSubmitting: false,
      submissionResult,
      currentStep: 'success',
    });
    return true;
  },

  resetVoting: () => {
    set({
      selectedElection: null,
      selections: new Map<string, string>(),
      currentStep: 'select',
      isSubmitting: false,
      submissionResult: null,
    });
  },

  setStep: (step) => {
    set({ currentStep: step });
  },

  setSelectedElection: (election) => {
    set({
      selectedElection: election,
      selections: new Map<string, string>(),
      currentStep: 'select',
      submissionResult: null,
    });
  },
}));
