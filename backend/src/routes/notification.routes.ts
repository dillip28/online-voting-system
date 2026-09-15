import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// GET /notifications
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { unreadOnly, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId: req.user!.userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: req.user!.userId, isRead: false },
      }),
    ]);

    res.json({
      success: true,
      data: {
        items: notifications,
        total,
        unreadCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    throw error;
  }
});

// PATCH /notifications/:id/read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
    });

    if (!notification) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found' },
      });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    throw error;
  }
});

// PATCH /notifications/read-all
router.patch('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId: req.user!.userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({
      success: true,
      data: { markedCount: result.count },
    });
  } catch (error) {
    throw error;
  }
});

// DELETE /notifications/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
    });

    if (!notification) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found' },
      });
      return;
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.json({ success: true, data: { message: 'Notification deleted' } });
  } catch (error) {
    throw error;
  }
});

export default router;
