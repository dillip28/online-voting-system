import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '../setup';
import bcrypt from 'bcrypt';

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn(),
  },
}));

// Mock JWT
vi.mock('../../src/lib/jwt', () => ({
  signToken: vi.fn().mockReturnValue('mock_jwt_token'),
  verifyToken: vi.fn().mockReturnValue({
    userId: 'user-1',
    email: 'test@example.com',
    role: 'voter',
  }),
}));

describe('Auth API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role: 'voter',
        isActive: true,
        profile: {
          fullName: 'Test User',
          studentId: 'STU-001',
          department: 'CS',
          isVerified: true,
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);
      mockPrisma.session.create.mockResolvedValue({});

      // Import and test the service directly
      const { authService } = await import('../../src/services/auth.service');
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('POST /auth/register', () => {
    it('should register new user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.voterProfile.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-2',
        email: 'new@example.com',
        role: 'voter',
        profile: {
          fullName: 'New User',
          studentId: 'STU-002',
          department: 'CS',
        },
      });

      const { authService } = await import('../../src/services/auth.service');
      const result = await authService.register({
        email: 'new@example.com',
        password: 'Password123',
        role: 'voter',
        profile: {
          fullName: 'New User',
          studentId: 'STU-002',
          department: 'CS',
        },
      });

      expect(result.user.email).toBe('new@example.com');
    });
  });
});
