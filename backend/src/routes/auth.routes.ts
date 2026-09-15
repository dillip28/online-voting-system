import { Router, Response } from 'express';
import { authService } from '../services/auth.service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rate-limiter';
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '../validators/auth.schema';

const router = Router();

// POST /auth/login
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await authService.login(
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      res.json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

// POST /auth/register
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

// POST /auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    const result = await authService.logout(req.user!.userId, token);
    res.json({ success: true, data: result });
  } catch (error) {
    throw error;
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await authService.getProfile(req.user!.userId);
    res.json({ success: true, data: profile });
  } catch (error) {
    throw error;
  }
});

// PUT /auth/profile
router.put(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const profile = await authService.updateProfile(req.user!.userId, req.body);
      res.json({ success: true, data: profile });
    } catch (error) {
      throw error;
    }
  }
);

// POST /auth/change-password
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await authService.changePassword(req.user!.userId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
);

export default router;
