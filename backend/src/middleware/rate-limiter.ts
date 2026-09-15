import rateLimit from 'express-rate-limit';
import env from '../config/env';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Voting limiter (very strict)
export const votingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // 1 vote per minute per IP
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many voting attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
