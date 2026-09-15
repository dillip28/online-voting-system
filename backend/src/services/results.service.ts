import prisma from '../lib/prisma';
import { AppError } from '../middleware/error-handler';

export interface PositionResult {
  positionId: string;
  positionTitle: string;
  positionDescription: string | null;
  candidates: CandidateResult[];
  totalVotes: number;
  notaVotes: number;
}

export interface CandidateResult {
  candidateId: string | null;
  name: string;
  photoUrl: string | null;
  party: string | null;
  votes: number;
  percentage: number;
  rank: number;
  isWinner: boolean;
}

export interface ElectionResults {
  electionId: string;
  electionTitle: string;
  electionStatus: string;
  totalEligibleVoters: number;
  totalVotesCast: number;
  turnoutPercentage: number;
  positions: PositionResult[];
  lastCalculated: Date;
}

export class ResultsService {
  /**
   * Compute results directly from ballot_choices, update the results cache,
   * and return the full results object.
   */
  async computeAndCacheResults(electionId: string): Promise<ElectionResults> {
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: {
        positions: { orderBy: { displayOrder: 'asc' } },
      },
    });

    if (!election) {
      throw new AppError(404, 'NOT_FOUND', 'Election not found');
    }

    // Get all positions
    const positionIds = election.positions.map((p) => p.id);

    // Count votes per candidate per position from ballot_choices
    const voteCounts = await prisma.ballotChoice.groupBy({
      by: ['positionId', 'candidateId'],
      where: {
        ballot: { electionId },
        positionId: { in: positionIds },
      },
      _count: { id: true },
    });

    // Get total ballots for this election
    const totalVotesCast = await prisma.ballot.count({
      where: { electionId },
    });

    // Get total eligible voters
    const eligibilityStats = await prisma.electionVoterEligibility.aggregate({
      where: { electionId },
      _count: true,
    });
    const totalEligibleVoters = eligibilityStats._count;

    const turnoutPercentage =
      totalEligibleVoters > 0
        ? Math.round((totalVotesCast / totalEligibleVoters) * 10000) / 100
        : 0;

    // Build position results
    const positions: PositionResult[] = [];

    for (const position of election.positions) {
      const positionVotes = voteCounts.filter((v) => v.positionId === position.id);
      const totalPositionVotes = positionVotes.reduce((sum, v) => sum + v._count.id, 0);

      // Find NOTA votes (candidateId === null)
      const notaEntry = positionVotes.find((v) => v.candidateId === null);
      const notaVotes = notaEntry?._count.id || 0;

      // Get candidates for this position
      const candidates = await prisma.candidate.findMany({
        where: {
          electionId,
          positionId: position.id,
          status: 'approved',
        },
      });

      const candidateResults: CandidateResult[] = candidates.map((candidate) => {
        const voteEntry = positionVotes.find((v) => v.candidateId === candidate.id);
        const votes = voteEntry?._count.id || 0;
        const percentage =
          totalPositionVotes > 0
            ? Math.round((votes / totalPositionVotes) * 10000) / 100
            : 0;

        return {
          candidateId: candidate.id,
          name: candidate.name,
          photoUrl: candidate.photoUrl,
          party: candidate.party,
          votes,
          percentage,
          rank: 0, // Will be calculated after sorting
          isWinner: false,
        };
      });

      // Sort by votes descending to determine rank and winner
      candidateResults.sort((a, b) => b.votes - a.votes);
      candidateResults.forEach((c, index) => {
        c.rank = index + 1;
      });

      // Determine winners (top vote-getters; handle ties)
      const maxVotes = candidateResults.length > 0 ? candidateResults[0].votes : 0;
      if (maxVotes > 0) {
        candidateResults.forEach((c) => {
          c.isWinner = c.votes === maxVotes;
        });
      }

      // Add NOTA as a candidate result if there are NOTA votes
      if (notaVotes > 0) {
        candidateResults.push({
          candidateId: null,
          name: 'NOTA',
          photoUrl: null,
          party: null,
          votes: notaVotes,
          percentage:
            totalPositionVotes > 0
              ? Math.round((notaVotes / totalPositionVotes) * 10000) / 100
              : 0,
          rank: candidateResults.filter((c) => c.votes > notaVotes).length + 1,
          isWinner: false,
        });
      }

      positions.push({
        positionId: position.id,
        positionTitle: position.title,
        positionDescription: position.description,
        candidates: candidateResults,
        totalVotes: totalPositionVotes,
        notaVotes,
      });

      // Cache results for each candidate in this position
      const now = new Date();
      for (const cr of candidateResults) {
        if (cr.candidateId) {
          await prisma.resultsCache.upsert({
            where: {
              electionId_positionId_candidateId: {
                electionId,
                positionId: position.id,
                candidateId: cr.candidateId,
              },
            },
            update: {
              voteCount: cr.votes,
              percentage: cr.percentage,
              lastCalculated: now,
            },
            create: {
              electionId,
              positionId: position.id,
              candidateId: cr.candidateId,
              voteCount: cr.votes,
              percentage: cr.percentage,
              lastCalculated: now,
            },
          });
        } else if (cr.name === 'NOTA') {
          // Cache NOTA — find existing or create (can't use upsert with null in composite key)
          const existingNota = await prisma.resultsCache.findFirst({
            where: {
              electionId,
              positionId: position.id,
              candidateId: null,
            },
          });

          if (existingNota) {
            await prisma.resultsCache.update({
              where: { id: existingNota.id },
              data: {
                voteCount: cr.votes,
                percentage: cr.percentage,
                lastCalculated: now,
              },
            });
          } else {
            await prisma.resultsCache.create({
              data: {
                electionId,
                positionId: position.id,
                candidateId: null,
                voteCount: cr.votes,
                percentage: cr.percentage,
                lastCalculated: now,
              },
            });
          }
        }
      }
    }

    return {
      electionId: election.id,
      electionTitle: election.title,
      electionStatus: election.status,
      totalEligibleVoters,
      totalVotesCast,
      turnoutPercentage,
      positions,
      lastCalculated: new Date(),
    };
  }

  /**
   * Get results for an election. Computes fresh if election is closed/counting/results_published.
   * Returns cached results for other statuses (or throws if hidden).
   */
  async getResults(electionId: string, userRole?: string): Promise<ElectionResults> {
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      select: { id: true, status: true, settings: true },
    });

    if (!election) {
      throw new AppError(404, 'NOT_FOUND', 'Election not found');
    }

    // Check visibility
    const settings = election.settings as Record<string, unknown>;
    const visibility = (settings?.resultVisibility as string) || 'after_close';

    if (visibility === 'hidden') {
      throw new AppError(403, 'FORBIDDEN', 'Results are hidden for this election');
    }

    if (visibility === 'admin_only' && userRole !== 'admin' && userRole !== 'super_admin') {
      throw new AppError(403, 'FORBIDDEN', 'Results are only visible to administrators');
    }

    // For elections that are closed, counting, or published — compute fresh results
    if (['closed', 'counting', 'results_published'].includes(election.status)) {
      return this.computeAndCacheResults(electionId);
    }

    // For other statuses, try to get cached results
    const cached = await prisma.resultsCache.findMany({
      where: { electionId },
      orderBy: { lastCalculated: 'desc' },
      take: 1,
    });

    if (cached.length > 0) {
      return this.computeAndCacheResults(electionId);
    }

    throw new AppError(400, 'NO_RESULTS', 'Results are not yet available for this election');
  }

  /**
   * Publish results for an election.
   */
  async publishResults(electionId: string, userId: string) {
    const election = await prisma.election.findUnique({ where: { id: electionId } });

    if (!election) {
      throw new AppError(404, 'NOT_FOUND', 'Election not found');
    }

    if (!['closed', 'counting'].includes(election.status)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Can only publish results for closed or counting elections'
      );
    }

    // Compute and cache results before publishing
    await this.computeAndCacheResults(electionId);

    const updated = await prisma.election.update({
      where: { id: electionId },
      data: { status: 'results_published' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'RESULTS_PUBLISHED',
        actorId: userId,
        targetType: 'election',
        targetId: electionId,
        metadata: { title: updated.title } as any,
      },
    });

    return updated;
  }

  /**
   * Get admin dashboard statistics.
   */
  async getDashboardStats() {
    const [
      totalVoters,
      verifiedVoters,
      activeElections,
      upcomingElections,
      completedElections,
      totalBallots,
      recentElections,
      recentAuditLogs,
      electionsByStatus,
    ] = await Promise.all([
      prisma.voterProfile.count(),
      prisma.voterProfile.count({ where: { isVerified: true } }),
      prisma.election.count({ where: { status: 'open' } }),
      prisma.election.count({ where: { status: 'scheduled' } }),
      prisma.election.count({
        where: { status: { in: ['closed', 'results_published'] } },
      }),
      prisma.ballot.count(),
      prisma.election.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          _count: { select: { ballots: true } },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          actor: {
            include: { profile: true },
          },
        },
      }),
      prisma.election.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const turnoutPercentage =
      totalVoters > 0 ? Math.round((totalBallots / totalVoters) * 10000) / 100 : 0;

    // Build votes-per-election data for chart
    const votesPerElection = recentElections.map((e) => ({
      name: e.title.length > 18 ? e.title.slice(0, 18) + '...' : e.title,
      votes: e._count.ballots,
    }));

    // Build status distribution for pie chart
    const statusMap: Record<string, number> = {};
    for (const s of electionsByStatus) {
      statusMap[s.status] = s._count.id;
    }

    return {
      stats: {
        totalVoters,
        verifiedVoters,
        activeElections,
        upcomingElections,
        completedElections,
        totalVotesCast: totalBallots,
        turnoutPercentage,
      },
      recentElections: recentElections.map((e) => ({
        id: e.id,
        title: e.title,
        status: e.status,
        totalVotes: e._count.ballots,
      })),
      recentAuditLogs: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        actorEmail: log.actor?.email || 'System',
        actorName: log.actor?.profile?.fullName || 'System',
        targetType: log.targetType,
        createdAt: log.createdAt,
      })),
      votesPerElection,
      statusDistribution: statusMap,
    };
  }

  /**
   * Get elections that have results available (closed, counting, or published).
   */
  async getElectionsWithResults() {
    const elections = await prisma.election.findMany({
      where: {
        status: { in: ['closed', 'counting', 'results_published'] },
      },
      include: {
        _count: {
          select: { ballots: true },
        },
        voterEligibility: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return elections.map((e) => ({
      id: e.id,
      title: e.title,
      status: e.status,
      totalVotes: e._count.ballots,
      eligibleVoters: e.voterEligibility.length,
    }));
  }
}

export const resultsService = new ResultsService();
