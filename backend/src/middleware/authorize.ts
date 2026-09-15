import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export type Role = 'voter' | 'election_officer' | 'admin' | 'super_admin';

export const authorize = (allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const userRole = req.user.role as Role;

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
      return;
    }

    next();
  };
};

// Convenience middleware for common role checks
export const requireVoter = authorize(['voter']);
export const requireAdmin = authorize(['admin', 'super_admin']);
export const requireSuperAdmin = authorize(['super_admin']);
export const requireElectionOfficer = authorize(['election_officer', 'admin', 'super_admin']);
