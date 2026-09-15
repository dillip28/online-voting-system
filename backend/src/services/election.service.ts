import prisma from '../lib/prisma';
import { AppError } from '../middleware/error-handler';
import { resultsService } from './results.service';
import {
  CreateElectionInput,
  UpdateElectionInput,
  ListElectionsQuery,
} from '../validators/election.schema';

export class ElectionService {
  async create(data: CreateElectionInput, createdBy: string) {
    // Validate dates
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (endTime <= startTime) {
      throw new AppError(400, 'VALIDATION_ERROR', 'End time must be after start time');
    }

    const election = await prisma.election.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        status: 'draft',
        startTime,
        endTime,
        createdBy,
        settings: data.settings || {},
        positions: {
          create: data.positions.map((pos) => ({
            title: pos.title,
            description: pos.description,
            displayOrder: pos.displayOrder,
            maxSelections: pos.maxSelections,
          })),
        },
      },
      include: {
        positions: true,
        creator: {
          include: { profile: true },
        },
      },
    });

    // Log audit
    await this.logAudit('ELECTION_CREATED', createdBy, 'election', election.id, {
      title: election.title,
      type: election.type,
    });

    return election;
  }

  async list(query: ListElectionsQuery, userId: string, userRole: string) {
    const { status, search, page, limit, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Search by title
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    // Role-based filtering
    if (userRole === 'voter') {
      // Voters can only see non-draft elections they're eligible for
      where.status = { not: 'draft' };
      where.voterEligibility = {
        some: { voterId: userId },
      };
    } else if (userRole === 'admin') {
      // Admins see their own elections + non-draft elections
      where.OR = [
        { createdBy: userId },
        { status: { not: 'draft' } },
      ];
    }
    // Super admins see everything

    const [elections, total] = await Promise.all([
      prisma.election.findMany({
        where,
        include: {
          positions: {
            select: { id: true },
          },
          candidates: {
            select: { id: true },
          },
          _count: {
            select: { ballots: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.election.count({ where }),
    ]);

    return {
      items: elections.map((e) => ({
        ...e,
        positionsCount: e.positions.length,
        candidatesCount: e.candidates.length,
        totalVotes: e._count.ballots,
        _count: undefined,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const election = await prisma.election.findUnique({
      where: { id },
      include: {
        positions: {
          orderBy: { displayOrder: 'asc' },
        },
        candidates: {
          select: { id: true },
        },
        creator: {
          include: { profile: true },
        },
        _count: {
          select: { ballots: true },
        },
      },
    });

    if (!election) {
      throw new AppError(404, 'NOT_FOUND', 'Election not found');
    }

    return {
      ...election,
      positionsCount: election.positions.length,
      candidatesCount: election.candidates.length,
      totalVotes: election._count.ballots,
      _count: undefined,
    };
  }

  async update(id: string, data: UpdateElectionInput, userId: string, userRole: string) {
    const election = await prisma.election.findUnique({ where: { id } });

    if (!election) {
      throw new AppError(404, 'NOT_FOUND', 'Election not found');
    }

    // Check ownership (unless super_admin)
    if (userRole !== 'super_admin' && election.createdBy !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'You can only edit your own elections');
    }

    // Can only edit draft or scheduled elections
    if (!['draft', 'scheduled'].includes(election.status)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Can only edit elections in draft or scheduled status'
      );
    }

    // Validate dates if provided
    if (data.startTime && data.endTime) {
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);
      if (endTime <= startTime) {
        throw new AppError(400, 'VALIDATION_ERROR', 'End time must be after start time');
      }
    }

    const updated = await prisma.election.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type && { type: data.type }),
        ...(data.startTime && { startTime: new Date(data.startTime) }),
        ...(data.endTime && { endTime: new Date(data.endTime) }),
        ...(data.settings && { settings: data.settings }),
      },
      include: {
        positions: true,
      },
    });

    // Log audit
    await this.logAudit('ELECTION_UPDATED', userId, 'election', id, {
      title: updated.title,
      changes: Object.keys(data),
    });

    return updated;
  }

  async open(id: string, userId: string) {
    const election = await prisma.election.findUnique({
      where: { id },
      include: {
        candidates: { where: { status: 'approved' } },
      },
    });

    if (!election) {
      throw new AppError(404, 'NOT_FOUND', 'Election not found');
    }

    // Must be in scheduled status
    if (election.status !== 'scheduled') {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Can only open elections in scheduled status'
      );
    }

    // Must have at least one approved candidate
    if (election.candidates.length === 0) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Election must have at least one approved candidate'
      );
    }

    const updated = await prisma.election.update({
      where: { id },
      data: { status: 'open' },
    });

    // Log audit
    await this.logAudit('ELECTION_OPENED', userId, 'election', id, {
      title: updated.title,
    });

    return updated;
  }

  async close(id: string, userId: string) {
    const election = await prisma.election.findUnique({ where: { id } });

    if (!election) {
      throw new AppError(404, 'NOT_FOUND', 'Election not found');
    }

    if (election.status !== 'open') {
      throw new AppError(400, 'VALIDATION_ERROR', 'Can only close open elections');
    }

    const updated = await prisma.election.update({
      where: { id },
      data: { status: 'closed' },
    });

    // Log audit
    await this.logAudit('ELECTION_CLOSED', userId, 'election', id, {
      title: updated.title,
    });

    return updated;
  }

  async publishResults(id: string, userId: string) {
    const election = await prisma.election.findUnique({ where: { id } });

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

    const updated = await prisma.election.update({
      where: { id },
      data: { status: 'results_published' },
    });

    // Log audit
    await this.logAudit('RESULTS_PUBLISHED', userId, 'election', id, {
      title: updated.title,
    });

    return updated;
  }

  async getResults(id: string, userRole?: string) {
    return resultsService.getResults(id, userRole);
  }

  async getVoters(electionId: string, query: { voted?: boolean; page: number; limit: number }) {
    const election = await prisma.election.findUnique({ where: { id: electionId } });

    if (!election) {
      throw new AppError(404, 'NOT_FOUND', 'Election not found');
    }

    const { voted, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = { electionId };
    if (voted !== undefined) {
      where.hasVoted = voted;
    }

    const [voters, total] = await Promise.all([
      prisma.electionVoterEligibility.findMany({
        where,
        include: {
          voter: {
            include: {
              user: {
                select: { email: true },
              },
            },
          },
        },
        skip,
        take: limit,
      }),
      prisma.electionVoterEligibility.count({ where }),
    ]);

    const [stats, votedCount] = await Promise.all([
      prisma.electionVoterEligibility.aggregate({
        where: { electionId },
        _count: true,
      }),
      prisma.electionVoterEligibility.count({
        where: { electionId, hasVoted: true },
      }),
    ]);

    return {
      items: voters.map((v) => ({
        id: v.id,
        voterId: v.voterId,
        studentId: v.voter.studentId,
        fullName: v.voter.fullName,
        email: v.voter.user.email,
        isEligible: v.isEligible,
        hasVoted: v.hasVoted,
        votedAt: v.votedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalEligible: stats._count,
        totalVoted: votedCount,
        turnoutPercentage:
          stats._count > 0
            ? Math.round((votedCount / stats._count) * 10000) / 100
            : 0,
      },
    };
  }

  private async logAudit(
    action: string,
    actorId: string,
    targetType: string,
    targetId: string,
    metadata?: Record<string, unknown>
  ) {
    await prisma.auditLog.create({
      data: {
        action,
        actorId,
        targetType,
        targetId,
        metadata: (metadata || {}) as any,
      },
    });
  }
}

export const electionService = new ElectionService();
