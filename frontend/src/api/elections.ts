import * as storage from '@/services/electionStorage';
import type { ApiResponse, Candidate, Election, ElectionStatus, PaginatedResponse, Result } from '@/types';

interface ElectionFilters {
  status?: ElectionStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const electionsApi = {
  async getElections(filters?: ElectionFilters): Promise<ApiResponse<PaginatedResponse<Election>>> {
    const result = storage.getElections({
      status: filters?.status,
      search: filters?.search,
      page: filters?.page,
      limit: filters?.limit,
    });
    return { data: result, success: true };
  },

  async getElection(id: string): Promise<ApiResponse<Election>> {
    const election = storage.getElectionById(id);
    if (!election) throw new Error('Election not found');
    return { data: election, success: true };
  },

  async createElection(data: {
    title: string;
    description?: string;
    type: string;
    startTime: string;
    endTime: string;
    settings?: { allowNOTA?: boolean };
    positions: { title: string; description?: string; displayOrder: number; maxSelections?: number }[];
  }): Promise<ApiResponse<Election>> {
    const election = storage.createElection({
      title: data.title,
      description: data.description || '',
      type: data.type,
      organization: '',
      startDate: data.startTime,
      endDate: data.endTime,
      enableNota: data.settings?.allowNOTA ?? false,
      maxSelections: data.positions?.[0]?.maxSelections || 1,
      createdBy: 'admin',
      positions: (data.positions || []).map((p, i) => ({
        id: `pos_${Date.now()}_${i}`,
        electionId: '',
        title: p.title,
        description: p.description || '',
        maxSelections: p.maxSelections || 1,
        order: p.displayOrder || i,
      })),
    });
    return { data: election, success: true };
  },

  async updateElection(id: string, data: Record<string, unknown>): Promise<ApiResponse<Election>> {
    const updates: Partial<Election> = {};
    if (data.title) updates.title = data.title as string;
    if (data.description !== undefined) updates.description = data.description as string;
    if (data.type) updates.type = data.type as Election['type'];
    if (data.startTime) updates.startDate = data.startTime as string;
    if (data.endTime) updates.endDate = data.endTime as string;
    if (data.organization) updates.organization = data.organization as string;
    if (data.status) updates.status = data.status as ElectionStatus;

    const election = storage.updateElection(id, updates);
    if (!election) throw new Error('Election not found');
    return { data: election, success: true };
  },

  async deleteElection(id: string): Promise<ApiResponse<{ message: string }>> {
    const deleted = storage.deleteElection(id);
    if (!deleted) throw new Error('Election not found');
    return { data: { message: 'Election deleted successfully' }, success: true };
  },

  async getElectionCandidates(electionId: string): Promise<ApiResponse<Candidate[]>> {
    const candidates = storage.getCandidates(electionId);
    return { data: candidates, success: true };
  },

  async getElectionResults(electionId: string): Promise<ApiResponse<Result[]>> {
    const results = storage.getElectionResults(electionId);
    if (!results) throw new Error('Results not found');
    return { data: results as unknown as Result[], success: true };
  },

  async getElectionVoters(_electionId: string): Promise<ApiResponse<{ items: unknown[]; total: number; page: number; limit: number; totalPages: number }>> {
    return { data: { items: [], total: 0, page: 1, limit: 10, totalPages: 0 }, success: true };
  },

  async scheduleElection(id: string): Promise<ApiResponse<Election>> {
    const election = storage.scheduleElection(id);
    if (!election) throw new Error('Election not found');
    return { data: election, success: true };
  },

  async openElection(id: string): Promise<ApiResponse<Election>> {
    const election = storage.openElection(id);
    if (!election) throw new Error('Election not found');
    return { data: election, success: true };
  },

  async closeElection(id: string): Promise<ApiResponse<Election>> {
    const election = storage.closeElection(id);
    if (!election) throw new Error('Election not found');
    return { data: election, success: true };
  },

  async publishResults(id: string): Promise<ApiResponse<Election>> {
    const election = storage.publishResults(id);
    if (!election) throw new Error('Election not found');
    return { data: election, success: true };
  },
};
