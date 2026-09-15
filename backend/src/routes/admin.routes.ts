import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import prisma from '../lib/prisma';

const router = Router();

// GET /admin/dashboard
router.get(
  '/dashboard',
  authenticate,
  authorize(['admin', 'super_admin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const [
        totalVoters,
        verifiedVoters,
        activeElections,
        upcomingElections,
        completedElections,
        totalBallots,
        recentElections,
        recentAuditLogs,
      ] = await Promise.all([
        prisma.voterProfile.count(),
        prisma.voterProfile.count({ where: { isVerified: true } }),
        prisma.election.count({ where: { status: 'open' } }),
        prisma.election.count({ where: { status: 'scheduled' } }),
        prisma.election.count({ where: { status: 'results_published' } }),
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
      ]);

      const turnoutPercentage =
        totalVoters > 0 ? Math.round((totalBallots / totalVoters) * 10000) / 100 : 0;

      res.json({
        success: true,
        data: {
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
        },
      });
    } catch (error) {
      throw error;
    }
  }
);

// GET /admin/audit-logs
router.get(
  '/audit-logs',
  authenticate,
  authorize(['admin', 'super_admin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { action, actorId, startDate, endDate, page = '1', limit = '50' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      if (action) where.action = action;
      if (actorId) where.actorId = actorId;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            actor: {
              include: { profile: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          items: logs.map((log) => ({
            id: log.id,
            action: log.action,
            actorId: log.actorId,
            actorEmail: log.actor?.email || 'System',
            actorName: log.actor?.profile?.fullName || 'System',
            targetType: log.targetType,
            targetId: log.targetId,
            metadata: log.metadata,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            createdAt: log.createdAt,
          })),
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      throw error;
    }
  }
);

// GET /admin/settings
router.get(
  '/settings',
  authenticate,
  authorize(['admin', 'super_admin']),
  async (req: AuthRequest, res: Response) => {
    // For now, return default settings
    // In production, this would be stored in a settings table
    res.json({
      success: true,
      data: {
        siteName: 'VoteSecure',
        allowRegistration: true,
        requireEmailVerification: true,
        defaultElectionDuration: 8,
        maxCandidatesPerPosition: 10,
        enableNOTA: true,
        resultVisibility: 'after_close',
      },
    });
  }
);

// PUT /admin/settings
router.put(
  '/settings',
  authenticate,
  authorize(['super_admin']),
  async (req: AuthRequest, res: Response) => {
    // For now, just acknowledge the update
    // In production, this would update a settings table
    res.json({
      success: true,
      data: {
        message: 'Settings updated successfully',
        updatedAt: new Date(),
      },
    });
  }
);

export default router;
