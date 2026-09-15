import { Router, Response } from 'express';
import { votingService } from '../services/voting.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { votingLimiter } from '../middleware/rate-limiter';
import { submitBallotSchema, votingStatusSchema } from '../validators/voting.schema';
import prisma from '../lib/prisma';

const router = Router();

// Helper to get voter profile ID
async function getVoterProfileId(userId: string): Promise<string> {
  const profile = await prisma.voterProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) {
    throw new Error('Voter profile not found');
  }
  return profile.id;
}

// POST /voting/ballot
router.post(
  '/ballot',
  authenticate,
  authorize(['voter']),
  votingLimiter,
  validate(submitBallotSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const voterProfileId = await getVoterProfileId(req.user!.userId);
      const result = await votingService.submitBallot(
        req.body,
        req.user!.userId,
        voterProfileId
      );
      res.json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

// GET /voting/status/:electionId
router.get(
  '/status/:electionId',
  authenticate,
  validate(votingStatusSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const voterProfileId = await getVoterProfileId(req.user!.userId);
      const electionId = req.params.electionId as string;
      const result = await votingService.getVotingStatus(
        electionId,
        req.user!.userId,
        voterProfileId
      );
      res.json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

// GET /voting/history
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const voterProfileId = await getVoterProfileId(req.user!.userId);
    const result = await votingService.getVotingHistory(
      voterProfileId,
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20
    );
    res.json({ success: true, data: result });
  } catch (error) {
    throw error;
  }
});

export default router;
