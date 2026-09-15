import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import { signToken, JwtPayload } from '../lib/jwt';
import { AppError } from '../middleware/error-handler';
import {
  LoginInput,
  RegisterInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from '../validators/auth.schema';

const SALT_ROUNDS = 12;

export class AuthService {
  async login(data: LoginInput, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { profile: true },
    });

    if (!user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new AppError(401, 'UNAUTHORIZED', 'Account is deactivated');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
    }

    const tokenPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = signToken(tokenPayload);

    // Create session
    const tokenHash = await bcrypt.hash(token, 5);
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Log audit
    await this.logAudit('LOGIN', user.id, 'user', user.id, { email: user.email }, ipAddress, userAgent);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
          ? {
              fullName: user.profile.fullName,
              studentId: user.profile.studentId,
              department: user.profile.department,
              isVerified: user.profile.isVerified,
            }
          : null,
      },
    };
  }

  async register(data: RegisterInput) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(409, 'CONFLICT', 'Email already registered');
    }

    // Check if student ID already exists
    const existingProfile = await prisma.voterProfile.findUnique({
      where: { studentId: data.profile.studentId },
    });

    if (existingProfile) {
      throw new AppError(409, 'CONFLICT', 'Student ID already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: data.role,
        profile: {
          create: {
            studentId: data.profile.studentId,
            fullName: data.profile.fullName,
            department: data.profile.department,
            yearOfStudy: data.profile.yearOfStudy,
            phone: data.profile.phone,
          },
        },
      },
      include: { profile: true },
    });

    // Log audit
    await this.logAudit('USER_REGISTERED', user.id, 'user', user.id, { email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
          ? {
              fullName: user.profile.fullName,
              studentId: user.profile.studentId,
              department: user.profile.department,
            }
          : null,
      },
    };
  }

  async logout(userId: string, tokenHash?: string) {
    if (tokenHash) {
      // Delete specific session
      await prisma.session.deleteMany({
        where: { userId, tokenHash },
      });
    } else {
      // Delete all sessions for user
      await prisma.session.deleteMany({
        where: { userId },
      });
    }

    // Log audit
    await this.logAudit('LOGOUT', userId, 'user', userId);

    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      profile: user.profile
        ? {
            id: user.profile.id,
            studentId: user.profile.studentId,
            fullName: user.profile.fullName,
            department: user.profile.department,
            yearOfStudy: user.profile.yearOfStudy,
            phone: user.profile.phone,
            isVerified: user.profile.isVerified,
            verifiedAt: user.profile.verifiedAt,
          }
        : null,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    if (!user.profile) {
      throw new AppError(400, 'BAD_REQUEST', 'No profile found');
    }

    const updatedProfile = await prisma.voterProfile.update({
      where: { userId },
      data: {
        ...(data.fullName && { fullName: data.fullName }),
        ...(data.department && { department: data.department }),
        ...(data.yearOfStudy && { yearOfStudy: data.yearOfStudy }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
    });

    return {
      id: updatedProfile.id,
      studentId: updatedProfile.studentId,
      fullName: updatedProfile.fullName,
      department: updatedProfile.department,
      yearOfStudy: updatedProfile.yearOfStudy,
      phone: updatedProfile.phone,
    };
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    const isValidPassword = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError(401, 'UNAUTHORIZED', 'Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all sessions
    await prisma.session.deleteMany({
      where: { userId },
    });

    // Log audit
    await this.logAudit('PASSWORD_CHANGED', userId, 'user', userId);

    return { message: 'Password changed successfully' };
  }

  private async logAudit(
    action: string,
    actorId: string | null,
    targetType: string,
    targetId: string,
    metadata?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ) {
    await prisma.auditLog.create({
      data: {
        action,
        actorId,
        targetType,
        targetId,
        metadata: (metadata || {}) as any,
        ipAddress,
        userAgent,
      },
    });
  }
}

export const authService = new AuthService();
