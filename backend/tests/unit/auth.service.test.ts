import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import { authService } from '../../src/services/auth.service';
import { mockPrisma } from '../setup';

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn(),
  },
}));

// Mock JWT
vi.mock('../src/lib/jwt', () => ({
  signToken: vi.fn().mockReturnValue('mock_jwt_token'),
  verifyToken: vi.fn().mockReturnValue({
    userId: 'user-1',
    email: 'test@example.com',
    role: 'voter',
  }),
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should return token and user on valid credentials', async () => {
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

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('test@example.com');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { profile: true },
      });
    });

    it('should throw error on invalid email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error on invalid password', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role: 'voter',
        isActive: true,
        profile: {},
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error on inactive account', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role: 'voter',
        isActive: false,
        profile: {},
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Account is deactivated');
    });
  });

  describe('register', () => {
    it('should create new user successfully', async () => {
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
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should throw error on existing email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'existing@example.com',
      });

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'Password123',
          role: 'voter',
          profile: {
            fullName: 'Test',
            studentId: 'STU-003',
            department: 'CS',
          },
        })
      ).rejects.toThrow('Email already registered');
    });

    it('should throw error on existing student ID', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.voterProfile.findUnique.mockResolvedValue({
        id: 'existing-profile',
        studentId: 'STU-001',
      });

      await expect(
        authService.register({
          email: 'new@example.com',
          password: 'Password123',
          role: 'voter',
          profile: {
            fullName: 'Test',
            studentId: 'STU-001',
            department: 'CS',
          },
        })
      ).rejects.toThrow('Student ID already registered');
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'voter',
        isActive: true,
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        profile: {
          id: 'profile-1',
          studentId: 'STU-001',
          fullName: 'Test User',
          department: 'CS',
          yearOfStudy: 3,
          phone: '+1234567890',
          isVerified: true,
          verifiedAt: new Date(),
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.getProfile('user-1');

      expect(result.id).toBe('user-1');
      expect(result.profile?.fullName).toBe('Test User');
    });

    it('should throw error on non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.getProfile('nonexistent')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        id: 'user-1',
        passwordHash: 'old_hashed_password',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 2 });

      const result = await authService.changePassword('user-1', {
        currentPassword: 'oldPassword',
        newPassword: 'NewPassword123',
      });

      expect(result.message).toBe('Password changed successfully');
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should throw error on incorrect current password', async () => {
      const mockUser = {
        id: 'user-1',
        passwordHash: 'hashed_password',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        authService.changePassword('user-1', {
          currentPassword: 'wrongPassword',
          newPassword: 'NewPassword123',
        })
      ).rejects.toThrow('Current password is incorrect');
    });
  });
});
