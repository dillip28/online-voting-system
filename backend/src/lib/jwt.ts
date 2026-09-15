import jwt from 'jsonwebtoken';
import env from '../config/env';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export const signToken = (payload: JwtPayload): string => {
  // Use a numeric value (seconds) for expiresIn to avoid StringValue type issues
  // Default to 1 hour (3600 seconds) if parsing fails
  const expiresInSeconds = parseInt(env.JWT_EXPIRES_IN, 10) || 3600;
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresInSeconds });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};
