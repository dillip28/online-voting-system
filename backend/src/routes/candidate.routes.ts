import { Router, Response } from 'express';
import { candidateService } from '../services/candidate.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { candidateSchema, updateCandidateSchema } from '../validators/voting.schema';

const router = Router();

// GET /candidates
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await candidateService.list({
      electionId: req.query.electionId as string | undefined,
      positionId: req.query.positionId as string | undefined,
      status: req.query.status as string | undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    throw error;
  }
});

// GET /candidates/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await candidateService.getById(id);
    res.json({ success: true, data: result });
  } catch (error) {
    throw error;
  }
});

// POST /candidates
router.post(
  '/',
  authenticate,
  authorize(['admin', 'super_admin']),
  validate(candidateSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await candidateService.create(
        req.body,
        req.user!.userId,
        req.user!.role
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

// PUT /candidates/:id
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'super_admin']),
  validate(updateCandidateSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await candidateService.update(
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

// DELETE /candidates/:id
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'super_admin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const result = await candidateService.delete(
        id,
        req.user!.userId,
        req.user!.role
      );
      res.json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

export default router;
