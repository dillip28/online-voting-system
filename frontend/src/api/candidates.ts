import { apiClient } from './client';
import type { ApiResponse, Candidate, CandidateStatus, PaginatedResponse } from '@/types';

interface CandidateFilters {
  electionId?: string;
  positionId?: string;
  status?: CandidateStatus;
  search?: string;
  page?: number;
  limit?: number;
}

interface CreateCandidateData {
  electionId: string;
  positionId: string;
  name: string;
  party?: string;
  biography: string;
  manifesto: string;
  photo?: string;
}

interface UpdateCandidateData extends Partial<CreateCandidateData> {
  status?: CandidateStatus;
}

export const candidatesApi = {
  async getCandidates(filters?: CandidateFilters): Promise<ApiResponse<PaginatedResponse<Candidate>>> {
    return apiClient.get('/candidates', { params: filters as Record<string, string | number | boolean | undefined> });
  },

  async getCandidate(id: string): Promise<ApiResponse<Candidate>> {
    return apiClient.get(`/candidates/${id}`);
  },

  async createCandidate(data: CreateCandidateData): Promise<ApiResponse<Candidate>> {
    return apiClient.post('/candidates', data);
  },

  async updateCandidate(id: string, data: UpdateCandidateData): Promise<ApiResponse<Candidate>> {
    return apiClient.put(`/candidates/${id}`, data);
  },

  async deleteCandidate(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/candidates/${id}`);
  },
};
