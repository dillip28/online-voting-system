import { createHash } from 'crypto';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/error-handler';
import { SubmitBallotInput } from '../validators/voting.schema';

export class VotingService {
  async submitBallot(data: SubmitBallotInput, voterId: string, voterProfileId: string) {
    const { electionId, choices } = data;

    // Execute voting in a transaction for atomicity
    return await prisma.$transaction(async (tx) => {
      // 1. Lock voter status row (prevents race conditions)
      const voterStatus = await tx.electionVoterEligibility.findUnique({
        where: {
          electionId_voterId: { electionId, voterId: voterProfileId },
        },
      });

      if (!voterStatus) {
        throw new AppError(403, 'NOT_ELIGIBLE', 'You are not eligible to vote in this election');
      }

      if (!voterStatus.isEligible) {
        throw new AppError(403, 'NOT_ELIGIBLE', 'You are not eligible to vote in this election');
      }

      if (voterStatus.hasVoted) {
        // Return success for idempotency (already voted)
        return {
          success: true,
          alreadyVoted: true,
          message: 'You have already voted in this election',
        };
      }

      // 2. Verify election is open
      const election = await tx.election.findUnique({
        where: { id: electionId },
      });

      if (!election) {
        throw new AppError(404, 'NOT_FOUND', 'Election not found');
      }

      if (election.status !== 'open') {
        throw new AppError(400, 'ELECTION_CLOSED', 'Election is not open for voting');
      }

      // 3. Validate all choices
      for (const choice of choices) {
        // Verify position exists and belongs to this election
        const position = await tx.electionPosition.findFirst({
          where: {
            id: choice.positionId,
            electionId,
          },
        });

        if (!position) {
          throw new AppError(400, 'INVALID_CHOICE', `Invalid position: ${choice.positionId}`);
        }

        // Verify candidate (if not NOTA) belongs to this position
        if (choice.candidateId) {
          const candidate = await tx.candidate.findFirst({
            where: {
              id: choice.candidateId,
              electionId,
              positionId: choice.positionId,
              status: 'approved',
            },
          });

          if (!candidate) {
            throw new AppError(400, 'INVALID_CHOICE', `Invalid candidate: ${choice.candidateId}`);
          }
        }
      }

      // 4. Generate ballot hash for integrity
      const ballotContent = JSON.stringify({
        electionId,
        choices: choices.sort((a, b) => a.positionId.localeCompare(b.positionId)),
      });
      const ballotHash = createHash('sha256').update(ballotContent).digest('hex');

      // 5. Create ballot (NO voter_id - privacy preserving!)
      const ballot = await tx.ballot.create({
        data: {
          electionId,
          ballotHash,
          submittedAt: new Date(),
        },
      });

      // 6. Create ballot choices
      await tx.ballotChoice.createMany({
        data: choices.map((c) => ({
          ballotId: ballot.id,
          positionId: c.positionId,
          candidateId: c.candidateId,
        })),
      });

      // 7. Mark voter as having voted
      await tx.electionVoterEligibility.update({
        where: {
          electionId_voterId: { electionId, voterId: voterProfileId },
        },
        data: {
          hasVoted: true,
          votedAt: new Date(),
          voteTokenHash: ballotHash,
        },
      });

      // 8. Log audit (without ballot contents!)
      await tx.auditLog.create({
        data: {
          action: 'VOTE_CAST',
          actorId: voterId,
          targetType: 'election',
          targetId: electionId,
          metadata: {
            ballotId: ballot.id,
            // NOTE: Never log which candidates were voted for!
          },
        },
      });

      return {
        success: true,
        alreadyVoted: false,
        ballotId: ballot.id,
        confirmationToken: `CONFIRM-${ballot.id.slice(0, 8).toUpperCase()}`,
        message: 'Your vote has been recorded successfully.',
        votedAt: ballot.submittedAt,
      };
    });
  }

  async getVotingStatus(electionId: string, voterId: string, voterProfileId: string) {
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      select: {
        id: true,
        title: true,
        status: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!election) {
      throw new AppError(404, 'NOT_FOUND', 'Election not found');
    }

    const voterStatus = await prisma.electionVoterEligibility.findUnique({
      where: {
        electionId_voterId: { electionId, voterId: voterProfileId },
      },
    });

    return {
      electionId,
      electionTitle: election.title,
      electionStatus: election.status,
      startTime: election.startTime,
      endTime: election.endTime,
      isEligible: voterStatus?.isEligible || false,
      hasVoted: voterStatus?.hasVoted || false,
      votedAt: voterStatus?.votedAt || null,
    };
  }

  async getVotingHistory(voterId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [votes, total] = await Promise.all([
      prisma.electionVoterEligibility.findMany({
        where: {
          voterId,
          hasVoted: true,
        },
        include: {
          election: {
            select: {
              id: true,
              title: true,
              status: true,
              endTime: true,
            },
          },
        },
        orderBy: { votedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.electionVoterEligibility.count({
        where: {
          voterId,
          hasVoted: true,
        },
      }),
    ]);

    return {
      items: votes.map((v) => ({
        electionId: v.election.id,
        electionTitle: v.election.title,
        electionStatus: v.election.status,
        votedAt: v.votedAt,
        status: 'submitted',
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const votingService = new VotingService();
