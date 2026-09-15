import prisma from '../lib/prisma';
import { AppError } from '../middleware/error-handler';
import { CandidateInput } from '../validators/voting.schema';

export class CandidateService {
  async list(query: { electionId?: string; positionId?: string; status?: string }) {
    const { electionId, positionId, status } = query;

    const where: any = {};
    if (electionId) where.electionId = electionId;
    if (positionId) where.positionId = positionId;
    if (status) where.status = status;

    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        election: {
          select: { id: true, title: true, status: true },
        },
        position: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return candidates;
  }

  async getById(id: string) {
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        election: {
          select: { id: true, title: true, status: true },
        },
        position: {
          select: { id: true, title: true, description: true },
        },
      },
    });

    if (!candidate) {
      throw new AppError(404, 'NOT_FOUND', 'Candidate not found');
    }

    return candidate;
  }

  async create(data: CandidateInput, userId: string, userRole: string) {
    // Verify election exists
    const election = await prisma.election.findUnique({
      where: { id: data.electionId },
    });

    if (!election) {
      throw new AppError(404, 'NOT_FOUND', 'Election not found');
    }

    // Check ownership
    if (userRole !== 'super_admin' && election.createdBy !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'You can only add candidates to your own elections');
    }

    // Can only add candidates to draft or scheduled elections
    if (!['draft', 'scheduled'].includes(election.status)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Can only add candidates to draft or scheduled elections'
      );
    }

    // Verify position exists
    const position = await prisma.electionPosition.findFirst({
      where: {
        id: data.positionId,
        electionId: data.electionId,
      },
    });

    if (!position) {
      throw new AppError(404, 'NOT_FOUND', 'Position not found in this election');
    }

    const candidate = await prisma.candidate.create({
      data: {
        electionId: data.electionId,
        positionId: data.positionId,
        name: data.name,
        photoUrl: data.photoUrl,
        manifesto: data.manifesto,
        party: data.party,
        status: data.status || 'pending',
      },
      include: {
        position: {
          select: { id: true, title: true },
        },
      },
    });

    // Log audit
    await this.logAudit('CANDIDATE_ADDED', userId, 'candidate', candidate.id, {
      name: candidate.name,
      electionId: data.electionId,
      positionId: data.positionId,
    });

    return candidate;
  }

  async update(id: string, data: any, userId: string, userRole: string) {
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: { election: true },
    });

    if (!candidate) {
      throw new AppError(404, 'NOT_FOUND', 'Candidate not found');
    }

    // Check ownership
    if (userRole !== 'super_admin' && candidate.election.createdBy !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'You can only update candidates in your own elections');
    }

    // Can only update candidates in draft or scheduled elections
    if (!['draft', 'scheduled'].includes(candidate.election.status)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Can only update candidates in draft or scheduled elections'
      );
    }

    const updated = await prisma.candidate.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
        ...(data.manifesto !== undefined && { manifesto: data.manifesto }),
        ...(data.party !== undefined && { party: data.party }),
        ...(data.status && { status: data.status }),
      },
      include: {
        position: {
          select: { id: true, title: true },
        },
      },
    });

    // Log audit
    await this.logAudit('CANDIDATE_UPDATED', userId, 'candidate', id, {
      name: updated.name,
      changes: Object.keys(data),
    });

    return updated;
  }

  async delete(id: string, userId: string, userRole: string) {
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        election: true,
        ballotChoices: { take: 1 },
      },
    });

    if (!candidate) {
      throw new AppError(404, 'NOT_FOUND', 'Candidate not found');
    }

    // Check ownership
    if (userRole !== 'super_admin' && candidate.election.createdBy !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'You can only delete candidates in your own elections');
    }

    // Can only delete candidates in draft or scheduled elections
    if (!['draft', 'scheduled'].includes(candidate.election.status)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Can only delete candidates in draft or scheduled elections'
      );
    }

    // Cannot delete if candidate has votes
    if (candidate.ballotChoices.length > 0) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Cannot delete candidate who has received votes'
      );
    }

    await prisma.candidate.delete({ where: { id } });

    // Log audit
    await this.logAudit('CANDIDATE_REMOVED', userId, 'candidate', id, {
      name: candidate.name,
      electionId: candidate.electionId,
    });

    return { message: 'Candidate removed successfully' };
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

export const candidateService = new CandidateService();
