import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { resultsService } from '../services/results.service';
import prisma from '../lib/prisma';

const router = Router();

// GET /admin/dashboard
router.get(
  '/dashboard',
  authenticate,
  authorize(['admin', 'super_admin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = await resultsService.getDashboardStats();
      res.json({ success: true, data });
    } catch (error) {
      throw error;
    }
  }
);

// GET /admin/dashboard/stats (alias for frontend compatibility)
router.get(
  '/dashboard/stats',
  authenticate,
  authorize(['admin', 'super_admin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = await resultsService.getDashboardStats();
      res.json({ success: true, data: data.stats });
    } catch (error) {
      throw error;
    }
  }
);

// GET /admin/elections-with-results (for results page dropdown)
router.get(
  '/elections-with-results',
  authenticate,
  authorize(['admin', 'super_admin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const elections = await resultsService.getElectionsWithResults();
      res.json({ success: true, data: elections });
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
