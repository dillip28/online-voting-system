import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../setup';

describe('Election API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Election Lifecycle', () => {
    it('should create, open, close, and publish results', async () => {
      // Create election
      const mockElection = {
        id: 'election-1',
        title: 'Test Election',
        status: 'draft',
        startTime: new Date('2026-10-01T09:00:00Z'),
        endTime: new Date('2026-10-01T18:00:00Z'),
        createdBy: 'admin-1',
        settings: { allowNOTA: true },
        positions: [{ id: 'pos-1', title: 'President' }],
        candidates: [],
        creator: { profile: { fullName: 'Admin' } },
      };

      mockPrisma.election.create.mockResolvedValue(mockElection);
      mockPrisma.auditLog.create.mockResolvedValue({});

      const { electionService } = await import('../../src/services/election.service');

      const created = await electionService.create(
        {
          title: 'Test Election',
          type: 'student',
          startTime: '2026-10-01T09:00:00Z',
          endTime: '2026-10-01T18:00:00Z',
          positions: [{ title: 'President', displayOrder: 1, maxSelections: 1 }],
        },
        'admin-1'
      );

      expect(created.id).toBe('election-1');
      expect(created.status).toBe('draft');

      // Open election
      mockPrisma.election.findUnique.mockResolvedValue({
        ...mockElection,
        status: 'scheduled',
        candidates: [{ id: 'c-1', status: 'approved' }],
      });
      mockPrisma.election.update.mockResolvedValue({
        ...mockElection,
        status: 'open',
      });

      const opened = await electionService.open('election-1', 'admin-1');
      expect(opened.status).toBe('open');

      // Close election
      mockPrisma.election.findUnique.mockResolvedValue({
        ...mockElection,
        status: 'open',
      });
      mockPrisma.election.update.mockResolvedValue({
        ...mockElection,
        status: 'closed',
      });

      const closed = await electionService.close('election-1', 'admin-1');
      expect(closed.status).toBe('closed');

      // Publish results
      mockPrisma.election.findUnique.mockResolvedValue({
        ...mockElection,
        status: 'closed',
      });
      mockPrisma.election.update.mockResolvedValue({
        ...mockElection,
        status: 'results_published',
      });

      const published = await electionService.publishResults('election-1', 'admin-1');
      expect(published.status).toBe('results_published');
    });
  });

  describe('Vote Tallying', () => {
    it('should calculate results correctly', async () => {
      const mockElection = {
        id: 'election-1',
        title: 'Test Election',
        status: 'results_published',
        positions: [
          { id: 'pos-1', title: 'President', displayOrder: 1 },
        ],
        _count: { ballots: 100 },
      };

      const mockCandidates = [
        { id: 'c-1', name: 'Alice', party: 'Party A', photoUrl: null },
        { id: 'c-2', name: 'Bob', party: 'Party B', photoUrl: null },
      ];

      const mockResults = [
        { candidateId: 'c-1', voteCount: 60 },
        { candidateId: 'c-2', voteCount: 40 },
      ];

      mockPrisma.election.findUnique.mockResolvedValue(mockElection);
      mockPrisma.candidate.findMany.mockResolvedValue(mockCandidates);
      mockPrisma.resultsCache.findMany.mockResolvedValue(mockResults);

      const { electionService } = await import('../../src/services/election.service');
      const results = await electionService.getResults('election-1');

      expect(results.totalVotesCast).toBe(100);
      expect(results.positions).toHaveLength(1);
      expect(results.positions[0].candidates).toHaveLength(2);
    });
  });
});
