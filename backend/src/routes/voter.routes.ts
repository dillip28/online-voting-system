import { Router, Response } from 'express';
import { voterService } from '../services/voter.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { updateVoterStatusSchema, importVotersSchema } from '../validators/voting.schema';

const router = Router();

// GET /voters
router.get(
  '/',
  authenticate,
  authorize(['admin', 'super_admin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await voterService.list({
        search: req.query.search as string | undefined,
        department: req.query.department as string | undefined,
        verified: req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

// GET /voters/:id
router.get(
  '/:id',
  authenticate,
  authorize(['admin', 'super_admin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await voterService.getById(id);
      res.json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

// PATCH /voters/:id/status
router.patch(
  '/:id/status',
  authenticate,
  authorize(['admin', 'super_admin']),
  validate(updateVoterStatusSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await voterService.updateStatus(
        id,
        req.body.isVerified,
        req.user!.userId
      );
      res.json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

// POST /voters/import
router.post(
  '/import',
  authenticate,
  authorize(['admin', 'super_admin']),
  validate(importVotersSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await voterService.importVoters(req.body, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

// POST /voters/assign
router.post(
  '/assign',
  authenticate,
  authorize(['admin', 'super_admin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { voterIds, electionId } = req.body;
      const result = await voterService.assignToElection(
        voterIds,
        electionId,
        req.user!.userId
      );
      res.json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

export default router;
