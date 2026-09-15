import { describe, it, expect, vi, beforeEach } from 'vitest';
import { votingService } from '../../src/services/voting.service';
import { mockPrisma } from '../setup';

// Mock crypto
vi.mock('crypto', () => ({
  createHash: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnValue({
      digest: vi.fn().mockReturnValue('mock_ballot_hash'),
    }),
  }),
}));

describe('VotingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitBallot', () => {
    it('should submit ballot successfully', async () => {
      const mockVoterStatus = {
        electionId: 'election-1',
        voterId: 'voter-1',
        isEligible: true,
        hasVoted: false,
      };

      const mockElection = {
        id: 'election-1',
        status: 'open',
      };

      const mockPosition = {
        id: 'pos-1',
        electionId: 'election-1',
      };

      const mockCandidate = {
        id: 'candidate-1',
        electionId: 'election-1',
        positionId: 'pos-1',
        status: 'approved',
      };

      const mockBallot = {
        id: 'ballot-1',
        electionId: 'election-1',
        ballotHash: 'mock_ballot_hash',
        submittedAt: new Date(),
      };

      mockPrisma.electionVoterEligibility.findUnique.mockResolvedValue(mockVoterStatus);
      mockPrisma.election.findUnique.mockResolvedValue(mockElection);
      mockPrisma.electionPosition.findFirst.mockResolvedValue(mockPosition);
      mockPrisma.candidate.findFirst.mockResolvedValue(mockCandidate);
      mockPrisma.ballot.create.mockResolvedValue(mockBallot);
      mockPrisma.ballotChoice.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.electionVoterEligibility.update.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      // Mock transaction - callback form: prisma.$transaction(async (tx) => { ... })
      mockPrisma.$transaction.mockImplementation(async (arg: any) => {
        if (typeof arg === 'function') {
          return await arg(mockPrisma);
        }
        const results = [];
        for (const fn of arg) {
          results.push(await fn(mockPrisma));
        }
        return results;
      });

      const result = await votingService.submitBallot(
        {
          electionId: 'election-1',
          choices: [{ positionId: 'pos-1', candidateId: 'candidate-1' }],
        },
        'user-1',
        'voter-1'
      );

      expect(result.success).toBe(true);
      expect(result.ballotId).toBe('ballot-1');
      expect(result.confirmationToken).toBeDefined();
    });

    it('should return already voted for duplicate submission', async () => {
      const mockVoterStatus = {
        electionId: 'election-1',
        voterId: 'voter-1',
        isEligible: true,
        hasVoted: true,
      };

      mockPrisma.electionVoterEligibility.findUnique.mockResolvedValue(mockVoterStatus);

      mockPrisma.$transaction.mockImplementation(async (arg: any) => {
        if (typeof arg === 'function') {
          return await arg(mockPrisma);
        }
        const results = [];
        for (const fn of arg) {
          results.push(await fn(mockPrisma));
        }
        return results;
      });

      const result = await votingService.submitBallot(
        {
          electionId: 'election-1',
          choices: [{ positionId: 'pos-1', candidateId: 'candidate-1' }],
        },
        'user-1',
        'voter-1'
      );

      expect(result.alreadyVoted).toBe(true);
    });

    it('should throw error when voter not eligible', async () => {
      mockPrisma.electionVoterEligibility.findUnique.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (arg: any) => {
        if (typeof arg === 'function') {
          return await arg(mockPrisma);
        }
        const results = [];
        for (const fn of arg) {
          results.push(await fn(mockPrisma));
        }
        return results;
      });

      await expect(
        votingService.submitBallot(
          {
            electionId: 'election-1',
            choices: [{ positionId: 'pos-1', candidateId: 'candidate-1' }],
          },
          'user-1',
          'voter-1'
        )
      ).rejects.toThrow('You are not eligible to vote in this election');
    });

    it('should throw error when election not open', async () => {
      const mockVoterStatus = {
        electionId: 'election-1',
        voterId: 'voter-1',
        isEligible: true,
        hasVoted: false,
      };

      const mockElection = {
        id: 'election-1',
        status: 'closed',
      };

      mockPrisma.electionVoterEligibility.findUnique.mockResolvedValue(mockVoterStatus);
      mockPrisma.election.findUnique.mockResolvedValue(mockElection);

      mockPrisma.$transaction.mockImplementation(async (arg: any) => {
        if (typeof arg === 'function') {
          return await arg(mockPrisma);
        }
        const results = [];
        for (const fn of arg) {
          results.push(await fn(mockPrisma));
        }
        return results;
      });

      await expect(
        votingService.submitBallot(
          {
            electionId: 'election-1',
            choices: [{ positionId: 'pos-1', candidateId: 'candidate-1' }],
          },
          'user-1',
          'voter-1'
        )
      ).rejects.toThrow('Election is not open for voting');
    });

    it('should throw error on invalid position', async () => {
      const mockVoterStatus = {
        electionId: 'election-1',
        voterId: 'voter-1',
        isEligible: true,
        hasVoted: false,
      };

      const mockElection = {
        id: 'election-1',
        status: 'open',
      };

      mockPrisma.electionVoterEligibility.findUnique.mockResolvedValue(mockVoterStatus);
      mockPrisma.election.findUnique.mockResolvedValue(mockElection);
      mockPrisma.electionPosition.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (arg: any) => {
        if (typeof arg === 'function') {
          return await arg(mockPrisma);
        }
        const results = [];
        for (const fn of arg) {
          results.push(await fn(mockPrisma));
        }
        return results;
      });

      await expect(
        votingService.submitBallot(
          {
            electionId: 'election-1',
            choices: [{ positionId: 'invalid-pos', candidateId: 'candidate-1' }],
          },
          'user-1',
          'voter-1'
        )
      ).rejects.toThrow('Invalid position');
    });
  });

  describe('getVotingStatus', () => {
    it('should return voting status', async () => {
      const mockElection = {
        id: 'election-1',
        title: 'Test Election',
        status: 'open',
        startTime: new Date(),
        endTime: new Date(),
      };

      const mockVoterStatus = {
        isEligible: true,
        hasVoted: false,
        votedAt: null,
      };

      mockPrisma.election.findUnique.mockResolvedValue(mockElection);
      mockPrisma.electionVoterEligibility.findUnique.mockResolvedValue(mockVoterStatus);

      const result = await votingService.getVotingStatus(
        'election-1',
        'user-1',
        'voter-1'
      );

      expect(result.electionId).toBe('election-1');
      expect(result.isEligible).toBe(true);
      expect(result.hasVoted).toBe(false);
    });

    it('should throw error when election not found', async () => {
      mockPrisma.election.findUnique.mockResolvedValue(null);

      await expect(
        votingService.getVotingStatus('nonexistent', 'user-1', 'voter-1')
      ).rejects.toThrow('Election not found');
    });
  });

  describe('getVotingHistory', () => {
    it('should return voting history', async () => {
      const mockHistory = [
        {
          election: {
            id: 'e-1',
            title: 'Election 1',
            status: 'results_published',
            endTime: new Date(),
          },
          votedAt: new Date(),
        },
      ];

      mockPrisma.electionVoterEligibility.findMany.mockResolvedValue(mockHistory);
      mockPrisma.electionVoterEligibility.count.mockResolvedValue(1);

      const result = await votingService.getVotingHistory('voter-1');

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
