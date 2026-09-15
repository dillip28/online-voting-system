import { apiClient } from './client';
import type { ApiResponse, VoteHistory } from '@/types';

interface BallotChoice {
  positionId: string;
  candidateId: string | null;
}

interface SubmitBallotData {
  electionId: string;
  choices: BallotChoice[];
}

interface BallotSubmissionResult {
  success: boolean;
  alreadyVoted?: boolean;
  ballotId?: string;
  confirmationToken?: string;
  message: string;
  votedAt?: string;
}

interface VotingStatus {
  electionId: string;
  electionTitle: string;
  electionStatus: string;
  startTime: string;
  endTime: string;
  isEligible: boolean;
  hasVoted: boolean;
  votedAt: string | null;
}

export const votesApi = {
  async submitBallot(data: SubmitBallotData): Promise<ApiResponse<BallotSubmissionResult>> {
    return apiClient.post('/voting/ballot', data);
  },

  async getVotingStatus(electionId: string): Promise<ApiResponse<VotingStatus>> {
    return apiClient.get(`/voting/status/${electionId}`);
  },

  async getVotingHistory(page?: number, limit?: number): Promise<ApiResponse<{
    items: VoteHistory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    return apiClient.get('/voting/history', {
      params: { page: page || 1, limit: limit || 20 },
    });
  },
};
