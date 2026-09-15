import { Router, Response } from 'express';
import { electionService } from '../services/election.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  createElectionSchema,
  updateElectionSchema,
  listElectionsSchema,
  electionIdSchema,
} from '../validators/election.schema';

const router = Router();

// GET /elections
router.get(
  '/',
  authenticate,
  validate(listElectionsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await electionService.list(
        req.query as any,
        req.user!.userId,
        req.user!.role
      );
      res.json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

// GET /elections/:id
router.get(
  '/:id',
  authenticate,
  validate(electionIdSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await electionService.getById(id);
      res.json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

// POST /elections
router.post(
  '/',
  authenticate,
  authorize(['admin', 'super_admin']),
  validate(createElectionSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await electionService.create(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

// PUT /elections/:id
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'super_admin']),
  validate(updateElectionSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await electionService.update(
        id,
        req.body,
        req.user!.userId,
        req.user!.role
      );
      res.json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

// POST /elections/:id/open
router.post(
  '/:id/open',
  authenticate,
  authorize(['admin', 'super_admin']),
  validate(electionIdSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await electionService.open(id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

// POST /elections/:id/close
router.post(
  '/:id/close',
  authenticate,
  authorize(['admin', 'super_admin']),
  validate(electionIdSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await electionService.close(id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

// POST /elections/:id/publish-results
router.post(
  '/:id/publish-results',
  authenticate,
  authorize(['admin', 'super_admin']),
  validate(electionIdSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await electionService.publishResults(id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

// GET /elections/:id/results
router.get(
  '/:id/results',
  authenticate,
  validate(electionIdSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await electionService.getResults(id);
      res.json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

// GET /elections/:id/voters
router.get(
  '/:id/voters',
  authenticate,
  authorize(['admin', 'super_admin']),
  validate(electionIdSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await electionService.getVoters(id, {
        voted: req.query.voted === 'true' ? true : req.query.voted === 'false' ? false : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

export default router;
