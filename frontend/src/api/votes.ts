import { apiClient } from './client';
import type { ApiResponse, Vote, VoteHistory, VoteSubmission } from '@/types';

interface VoteConfirmation {
  confirmationId: string;
  electionId: string;
  electionTitle: string;
  submittedAt: string;
  status: string;
}

export const votesApi = {
  async submitVote(data: VoteSubmission): Promise<ApiResponse<Vote>> {
    return apiClient.post('/votes', data);
  },

  async getVoteHistory(): Promise<ApiResponse<VoteHistory[]>> {
    return apiClient.get('/votes/history');
  },

  async getVoteConfirmation(electionId: string): Promise<ApiResponse<VoteConfirmation>> {
    return apiClient.get(`/votes/confirmation/${electionId}`);
  },
};
