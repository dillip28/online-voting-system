import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-min-32-chars!';
process.env.JWT_EXPIRES_IN = '1h';
process.env.PORT = '3000';
process.env.NODE_ENV = 'test';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX = '100';
process.env.UPLOAD_DIR = './uploads';
process.env.MAX_FILE_SIZE = '5242880';

// Mock Prisma client for tests
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  voterProfile: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  election: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  electionPosition: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  candidate: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  electionVoterEligibility: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  ballot: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
  ballotChoice: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    groupBy: vi.fn(),
  },
  resultsCache: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
  auditLog: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
  securityEvent: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  session: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  notification: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(async (arg: any) => {
    if (typeof arg === 'function') {
      // Interactive transaction: prisma.$transaction(async (tx) => { ... })
      return await arg(mockPrisma);
    }
    // Batch transaction: prisma.$transaction([fn1, fn2, ...])
    const results = [];
    for (const fn of arg) {
      results.push(await fn(mockPrisma));
    }
    return results;
  }),
};

// Mock the prisma module - use the path that matches what the services use
vi.mock('@/lib/prisma', () => ({
  default: mockPrisma,
}));

// Also mock the resolved path
vi.mock('../src/lib/prisma', () => ({
  default: mockPrisma,
}));

// Mock env config
vi.mock('@/config/env', () => ({
  default: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    JWT_SECRET: 'test-secret-key-for-testing-min-32-chars!',
    JWT_EXPIRES_IN: '1h',
    PORT: 3000,
    NODE_ENV: 'test',
    CORS_ORIGIN: 'http://localhost:5173',
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX: 100,
    UPLOAD_DIR: './uploads',
    MAX_FILE_SIZE: 5242880,
  },
}));

vi.mock('../src/config/env', () => ({
  default: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    JWT_SECRET: 'test-secret-key-for-testing-min-32-chars!',
    JWT_EXPIRES_IN: '1h',
    PORT: 3000,
    NODE_ENV: 'test',
    CORS_ORIGIN: 'http://localhost:5173',
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX: 100,
    UPLOAD_DIR: './uploads',
    MAX_FILE_SIZE: 5242880,
  },
}));

// Export for use in tests
export { mockPrisma };

beforeAll(() => {
  // Setup test environment
});

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks();
});

afterAll(() => {
  // Cleanup
});
