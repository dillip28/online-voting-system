import * as storage from '@/services/electionStorage';
import type { ApiResponse, VoteHistory } from '@/types';
import { useAuthStore } from '@/store/auth-store';

interface SubmitBallotData {
  electionId: string;
  choices: { positionId: string; candidateId: string | null }[];
}

export const votesApi = {
  async submitBallot(data: SubmitBallotData): Promise<ApiResponse<{
    success: boolean;
    alreadyVoted?: boolean;
    ballotId?: string;
    confirmationToken?: string;
    message: string;
    votedAt?: string;
  }>> {
    const user = useAuthStore.getState().user;
    const voterId = user?.id || 'demo_voter';

    if (storage.hasUserVoted(data.electionId, voterId)) {
      return {
        data: {
          success: false,
          alreadyVoted: true,
          message: 'You have already voted in this election',
        },
        success: true,
      };
    }

    const selections = data.choices.map((c) => ({
      positionId: c.positionId,
      candidateId: c.candidateId,
      isNota: c.candidateId === null,
    }));

    const result = storage.saveVote(data.electionId, voterId, selections);

    if (!result.success) {
      return {
        data: {
          success: false,
          alreadyVoted: result.alreadyVoted,
          message: result.alreadyVoted ? 'You have already voted in this election' : 'Failed to submit vote',
        },
        success: true,
      };
    }

    return {
      data: {
        success: true,
        ballotId: `ballot_${Date.now()}`,
        confirmationToken: result.confirmationId,
        message: 'Vote submitted successfully',
        votedAt: result.votedAt,
      },
      success: true,
    };
  },

  async getVotingStatus(electionId: string): Promise<ApiResponse<{
    electionId: string;
    electionTitle: string;
    electionStatus: string;
    startTime: string;
    endTime: string;
    isEligible: boolean;
    hasVoted: boolean;
    votedAt: string | null;
  }>> {
    const user = useAuthStore.getState().user;
    const voterId = user?.id || 'demo_voter';
    const election = storage.getElectionById(electionId);
    if (!election) throw new Error('Election not found');

    return {
      data: {
        electionId,
        electionTitle: election.title,
        electionStatus: election.status,
        startTime: election.startDate,
        endTime: election.endDate,
        isEligible: true,
        hasVoted: storage.hasUserVoted(electionId, voterId),
        votedAt: null,
      },
      success: true,
    };
  },

  async getVotingHistory(): Promise<ApiResponse<{
    items: VoteHistory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    const user = useAuthStore.getState().user;
    const voterId = user?.id || 'demo_voter';
    const history = storage.getVotingHistory(voterId);

    return {
      data: {
        items: history.map((h) => ({
          id: h.electionId,
          election: {
            id: h.electionId,
            title: h.electionTitle,
            type: 'student' as const,
            endDate: new Date().toISOString(),
          },
          confirmationId: h.confirmationId,
          status: 'submitted' as const,
          submittedAt: h.votedAt,
        })),
        total: history.length,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
      success: true,
    };
  },
};
