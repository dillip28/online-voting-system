import { create } from 'zustand';
import type { Election } from '@/types';
import { votesApi } from '@/api/votes';

type VotingStep = 'select' | 'review' | 'confirm' | 'success';

interface SubmissionResult {
  ballotId?: string;
  confirmationId: string;
  submittedAt: string;
  message: string;
}

interface VotingState {
  selectedElection: Election | null;
  selections: Map<string, string>;
  currentStep: VotingStep;
  isSubmitting: boolean;
  submissionResult: SubmissionResult | null;
  error: string | null;
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
  error: null,

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
    const { selectedElection, selections, isSubmitting } = get();
    if (!selectedElection || selections.size === 0 || isSubmitting) return false;

    set({ isSubmitting: true, error: null });
    try {
      const choices = Array.from(selections.entries()).map(([positionId, candidateId]) => ({
        positionId,
        candidateId: candidateId === 'NOTA' ? null : candidateId,
      }));

      const response = await votesApi.submitBallot({
        electionId: selectedElection.id,
        choices,
      });

      if (response.success && response.data) {
        const { data } = response;
        if (data.alreadyVoted) {
          set({
            isSubmitting: false,
            error: 'You have already voted in this election',
          });
          return false;
        }

        const submissionResult: SubmissionResult = {
          ballotId: data.ballotId,
          confirmationId: data.confirmationToken || '',
          submittedAt: data.votedAt || new Date().toISOString(),
          message: data.message,
        };

        set({
          isSubmitting: false,
          submissionResult,
          currentStep: 'success',
        });
        return true;
      }

      set({ isSubmitting: false, error: 'Failed to submit vote' });
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit vote';
      set({ isSubmitting: false, error: errorMessage });
      return false;
    }
  },

  resetVoting: () => {
    set({
      selectedElection: null,
      selections: new Map<string, string>(),
      currentStep: 'select',
      isSubmitting: false,
      submissionResult: null,
      error: null,
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
      error: null,
    });
  },
}));
