import { apiClient } from './client';
import type { ApiResponse, Candidate, Election, ElectionStatus, PaginatedResponse, Result } from '@/types';

interface ElectionFilters {
  status?: ElectionStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateElectionData {
  title: string;
  description?: string;
  type: string;
  startTime: string;
  endTime: string;
  settings?: {
    allowNOTA?: boolean;
    resultVisibility?: string;
    requireStudentId?: boolean;
  };
  positions: {
    title: string;
    description?: string;
    displayOrder: number;
    maxSelections?: number;
  }[];
}

interface UpdateElectionData extends Partial<CreateElectionData> {
  status?: ElectionStatus;
  publishedResults?: boolean;
}

interface Voter {
  id: string;
  userId: string;
  electionId: string;
  hasVoted: boolean;
  votedAt?: string;
}

export const electionsApi = {
  async getElections(filters?: ElectionFilters): Promise<ApiResponse<PaginatedResponse<Election>>> {
    return apiClient.get('/elections', { params: filters as Record<string, string | number | boolean | undefined> });
  },

  async getElection(id: string): Promise<ApiResponse<Election>> {
    return apiClient.get(`/elections/${id}`);
  },

  async createElection(data: CreateElectionData): Promise<ApiResponse<Election>> {
    return apiClient.post('/elections', data);
  },

  async updateElection(id: string, data: UpdateElectionData): Promise<ApiResponse<Election>> {
    return apiClient.put(`/elections/${id}`, data);
  },

  async deleteElection(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/elections/${id}`);
  },

  async getElectionCandidates(electionId: string): Promise<ApiResponse<Candidate[]>> {
    return apiClient.get(`/elections/${electionId}/candidates`);
  },

  async getElectionResults(electionId: string): Promise<ApiResponse<Result[]>> {
    return apiClient.get(`/elections/${electionId}/results`);
  },

  async getElectionVoters(electionId: string, filters?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Voter>>> {
    return apiClient.get(`/elections/${electionId}/voters`, { params: filters as Record<string, string | number | boolean | undefined> });
  },

  async scheduleElection(id: string): Promise<ApiResponse<Election>> {
    return apiClient.post(`/elections/${id}/schedule`);
  },

  async openElection(id: string): Promise<ApiResponse<Election>> {
    return apiClient.post(`/elections/${id}/open`);
  },

  async closeElection(id: string): Promise<ApiResponse<Election>> {
    return apiClient.post(`/elections/${id}/close`);
  },

  async publishResults(id: string): Promise<ApiResponse<Election>> {
    return apiClient.post(`/elections/${id}/publish-results`);
  },
};
