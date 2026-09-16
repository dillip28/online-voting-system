import * as storage from '@/services/electionStorage';
import type { ApiResponse, Candidate, CandidateStatus, PaginatedResponse } from '@/types';

interface CandidateFilters {
  electionId?: string;
  positionId?: string;
  status?: CandidateStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export const candidatesApi = {
  async getCandidates(filters?: CandidateFilters): Promise<ApiResponse<PaginatedResponse<Candidate>>> {
    let candidates = storage.getCandidates(filters?.electionId);

    if (filters?.status) {
      candidates = candidates.filter((c) => c.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      candidates = candidates.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.party?.toLowerCase().includes(q) ?? false)
      );
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 100;
    const total = candidates.length;
    const totalPages = Math.ceil(total / limit);
    const items = candidates.slice((page - 1) * limit, page * limit);

    return { data: { items, total, page, limit, totalPages }, success: true };
  },

  async getCandidate(id: string): Promise<ApiResponse<Candidate>> {
    const candidate = storage.getCandidateById(id);
    if (!candidate) throw new Error('Candidate not found');
    return { data: candidate, success: true };
  },

  async createCandidate(data: {
    electionId: string;
    positionId: string;
    name: string;
    party?: string;
    biography: string;
    manifesto: string;
    photo?: string;
  }): Promise<ApiResponse<Candidate>> {
    const candidate = storage.createCandidate(data);
    return { data: candidate, success: true };
  },

  async updateCandidate(id: string, data: Partial<Candidate>): Promise<ApiResponse<Candidate>> {
    const candidate = storage.updateCandidate(id, data);
    if (!candidate) throw new Error('Candidate not found');
    return { data: candidate, success: true };
  },

  async deleteCandidate(id: string): Promise<ApiResponse<{ message: string }>> {
    const deleted = storage.deleteCandidate(id);
    if (!deleted) throw new Error('Candidate not found');
    return { data: { message: 'Candidate deleted' }, success: true };
  },
};
