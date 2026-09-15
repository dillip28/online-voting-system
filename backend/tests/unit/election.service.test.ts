import { describe, it, expect, vi, beforeEach } from 'vitest';
import { electionService } from '../../src/services/election.service';
import { mockPrisma } from '../setup';

describe('ElectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create election with positions', async () => {
      const mockElection = {
        id: 'election-1',
        title: 'Test Election',
        description: 'Test Description',
        type: 'student',
        status: 'draft',
        startTime: new Date('2026-10-01T09:00:00Z'),
        endTime: new Date('2026-10-01T18:00:00Z'),
        createdBy: 'admin-1',
        settings: { allowNOTA: true },
        positions: [
          { id: 'pos-1', title: 'President', displayOrder: 1 },
        ],
        creator: { profile: { fullName: 'Admin' } },
      };

      mockPrisma.election.create.mockResolvedValue(mockElection);
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await electionService.create(
        {
          title: 'Test Election',
          description: 'Test Description',
          type: 'student',
          startTime: '2026-10-01T09:00:00Z',
          endTime: '2026-10-01T18:00:00Z',
          settings: { allowNOTA: true, resultVisibility: 'after_close', requireStudentId: true },
          positions: [
            { title: 'President', displayOrder: 1, maxSelections: 1 },
          ],
        },
        'admin-1'
      );

      expect(result.id).toBe('election-1');
      expect(result.title).toBe('Test Election');
      expect(mockPrisma.election.create).toHaveBeenCalled();
    });

    it('should throw error when end time is before start time', async () => {
      await expect(
        electionService.create(
          {
            title: 'Test Election',
            type: 'student',
            startTime: '2026-10-01T18:00:00Z',
            endTime: '2026-10-01T09:00:00Z',
            positions: [{ title: 'President', displayOrder: 1, maxSelections: 1 }],
          },
          'admin-1'
        )
      ).rejects.toThrow('End time must be after start time');
    });
  });

  describe('getById', () => {
    it('should return election by id', async () => {
      const mockElection = {
        id: 'election-1',
        title: 'Test Election',
        status: 'open',
        positions: [],
        candidates: [{ id: 'c-1' }],
        creator: { profile: { fullName: 'Admin' } },
        _count: { ballots: 100 },
      };

      mockPrisma.election.findUnique.mockResolvedValue(mockElection);

      const result = await electionService.getById('election-1');

      expect(result.id).toBe('election-1');
      expect(result.totalVotes).toBe(100);
    });

    it('should throw error when election not found', async () => {
      mockPrisma.election.findUnique.mockResolvedValue(null);

      await expect(electionService.getById('nonexistent')).rejects.toThrow(
        'Election not found'
      );
    });
  });

  describe('open', () => {
    it('should open scheduled election with candidates', async () => {
      const mockElection = {
        id: 'election-1',
        status: 'scheduled',
        candidates: [{ id: 'c-1', status: 'approved' }],
      };

      mockPrisma.election.findUnique.mockResolvedValue(mockElection);
      mockPrisma.election.update.mockResolvedValue({
        ...mockElection,
        status: 'open',
      });
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await electionService.open('election-1', 'admin-1');

      expect(result.status).toBe('open');
    });

    it('should throw error when election not in scheduled status', async () => {
      const mockElection = {
        id: 'election-1',
        status: 'draft',
        candidates: [],
      };

      mockPrisma.election.findUnique.mockResolvedValue(mockElection);

      await expect(
        electionService.open('election-1', 'admin-1')
      ).rejects.toThrow('Can only open elections in scheduled status');
    });

    it('should throw error when no approved candidates', async () => {
      const mockElection = {
        id: 'election-1',
        status: 'scheduled',
        candidates: [],
      };

      mockPrisma.election.findUnique.mockResolvedValue(mockElection);

      await expect(
        electionService.open('election-1', 'admin-1')
      ).rejects.toThrow('Election must have at least one approved candidate');
    });
  });

  describe('close', () => {
    it('should close open election', async () => {
      const mockElection = {
        id: 'election-1',
        status: 'open',
      };

      mockPrisma.election.findUnique.mockResolvedValue(mockElection);
      mockPrisma.election.update.mockResolvedValue({
        ...mockElection,
        status: 'closed',
      });
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await electionService.close('election-1', 'admin-1');

      expect(result.status).toBe('closed');
    });

    it('should throw error when election not open', async () => {
      const mockElection = {
        id: 'election-1',
        status: 'draft',
      };

      mockPrisma.election.findUnique.mockResolvedValue(mockElection);

      await expect(
        electionService.close('election-1', 'admin-1')
      ).rejects.toThrow('Can only close open elections');
    });
  });

  describe('list', () => {
    it('should return paginated elections', async () => {
      const mockElections = [
        { id: 'e-1', title: 'Election 1', positions: [], candidates: [], _count: { ballots: 10 } },
        { id: 'e-2', title: 'Election 2', positions: [], candidates: [], _count: { ballots: 20 } },
      ];

      mockPrisma.election.findMany.mockResolvedValue(mockElections);
      mockPrisma.election.count.mockResolvedValue(2);

      const result = await electionService.list(
        { page: 1, limit: 20, sortBy: 'start_time', sortOrder: 'desc' },
        'admin-1',
        'admin'
      );

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });
});
