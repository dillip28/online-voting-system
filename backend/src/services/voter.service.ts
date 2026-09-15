import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/error-handler';
import { ImportVotersInput } from '../validators/voting.schema';

export class VoterService {
  async list(query: {
    search?: string;
    department?: string;
    verified?: boolean;
    page: number;
    limit: number;
  }) {
    const { search, department, verified, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (department) {
      where.department = department;
    }

    if (verified !== undefined) {
      where.isVerified = verified;
    }

    const [voters, total] = await Promise.all([
      prisma.voterProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              isActive: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.voterProfile.count({ where }),
    ]);

    return {
      items: voters.map((v) => ({
        id: v.id,
        userId: v.userId,
        email: v.user.email,
        studentId: v.studentId,
        fullName: v.fullName,
        department: v.department,
        yearOfStudy: v.yearOfStudy,
        phone: v.phone,
        isVerified: v.isVerified,
        isActive: v.user.isActive,
        createdAt: v.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const voter = await prisma.voterProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!voter) {
      throw new AppError(404, 'NOT_FOUND', 'Voter not found');
    }

    return {
      id: voter.id,
      userId: voter.userId,
      email: voter.user.email,
      studentId: voter.studentId,
      fullName: voter.fullName,
      department: voter.department,
      yearOfStudy: voter.yearOfStudy,
      phone: voter.phone,
      isVerified: voter.isVerified,
      verifiedAt: voter.verifiedAt,
      isActive: voter.user.isActive,
      createdAt: voter.createdAt,
    };
  }

  async updateStatus(id: string, isVerified: boolean, verifiedById: string) {
    const voter = await prisma.voterProfile.findUnique({ where: { id } });

    if (!voter) {
      throw new AppError(404, 'NOT_FOUND', 'Voter not found');
    }

    const updated = await prisma.voterProfile.update({
      where: { id },
      data: {
        isVerified,
        verifiedAt: isVerified ? new Date() : null,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: isVerified ? 'VOTER_VERIFIED' : 'VOTER_UNVERIFIED',
        actorId: verifiedById,
        targetType: 'voter',
        targetId: id,
        metadata: {
          studentId: voter.studentId,
          fullName: voter.fullName,
        },
      },
    });

    return updated;
  }

  async importVoters(data: ImportVotersInput, importedBy: string) {
    const results = {
      totalRows: data.voters.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };

    const defaultPassword = await bcrypt.hash('Welcome@123', 12);

    for (let i = 0; i < data.voters.length; i++) {
      const voterData = data.voters[i];
      const rowNumber = i + 1;

      try {
        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: voterData.email },
        });

        if (existingUser) {
          results.errors.push({ row: rowNumber, error: 'Email already exists' });
          results.failed++;
          continue;
        }

        // Check if student ID already exists
        const existingProfile = await prisma.voterProfile.findUnique({
          where: { studentId: voterData.studentId },
        });

        if (existingProfile) {
          results.errors.push({ row: rowNumber, error: 'Student ID already exists' });
          results.failed++;
          continue;
        }

        // Create user with voter profile
        await prisma.user.create({
          data: {
            email: voterData.email,
            passwordHash: defaultPassword,
            role: 'voter',
            profile: {
              create: {
                studentId: voterData.studentId,
                fullName: voterData.fullName,
                department: voterData.department,
                yearOfStudy: voterData.yearOfStudy,
                phone: voterData.phone,
                isVerified: true,
                verifiedAt: new Date(),
              },
            },
          },
        });

        results.successful++;
      } catch (error) {
        results.errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        results.failed++;
      }
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'VOTERS_IMPORTED',
        actorId: importedBy,
        targetType: 'voter',
        targetId: 'bulk',
        metadata: {
          totalRows: results.totalRows,
          successful: results.successful,
          failed: results.failed,
        },
      },
    });

    return results;
  }

  async assignToElection(
    voterIds: string[],
    electionId: string,
    assignedBy: string
  ) {
    const election = await prisma.election.findUnique({ where: { id: electionId } });

    if (!election) {
      throw new AppError(404, 'NOT_FOUND', 'Election not found');
    }

    const results = await prisma.electionVoterEligibility.createMany({
      data: voterIds.map((voterId) => ({
        electionId,
        voterId,
        isEligible: true,
      })),
      skipDuplicates: true,
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'VOTERS_ASSIGNED',
        actorId: assignedBy,
        targetType: 'election',
        targetId: electionId,
        metadata: {
          voterCount: voterIds.length,
          created: results.count,
        },
      },
    });

    return { assigned: results.count };
  }
}

export const voterService = new VoterService();
