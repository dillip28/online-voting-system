import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse, User } from '@/types';

interface VoterFilters {
  electionId?: string;
  search?: string;
  isVerified?: boolean;
  hasVoted?: boolean;
  page?: number;
  limit?: number;
}

interface Voter {
  id: string;
  userId: string;
  electionId: string;
  user?: User;
  hasVoted: boolean;
  votedAt?: string;
  isEligible: boolean;
}

interface UpdateVoterStatusData {
  isVerified: boolean;
}

interface ImportVotersData {
  electionId: string;
  voters: { email: string; studentId?: string }[];
}

export const votersApi = {
  async getVoters(filters?: VoterFilters): Promise<ApiResponse<PaginatedResponse<Voter>>> {
    return apiClient.get('/voters', { params: filters as Record<string, string | number | boolean | undefined> });
  },

  async getVoter(id: string): Promise<ApiResponse<Voter>> {
    return apiClient.get(`/voters/${id}`);
  },

  async updateVoterStatus(id: string, data: UpdateVoterStatusData): Promise<ApiResponse<Voter>> {
    return apiClient.patch(`/voters/${id}/status`, data);
  },

  async importVoters(data: ImportVotersData): Promise<ApiResponse<{ imported: number; failed: number; message: string }>> {
    return apiClient.post('/voters/import', data);
  },
};
