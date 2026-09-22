import type { User } from '@/types';
import { generateId } from '@/lib/utils';

const KEYS = {
  VOTERS: 'vs_voters',
  VOTER_INIT: 'vs_voters_initialized',
} as const;

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* Storage full or unavailable */ }
}

const DEMO_VOTERS: User[] = [
  {
    id: 'usr-voter-001',
    email: 'voter@test.com',
    fullName: 'Alex Johnson',
    phone: '+1-555-0101',
    studentId: 'STU-2024-0892',
    role: 'voter',
    avatar: '',
    isVerified: true,
    isActive: true,
    twoFactorEnabled: false,
    createdAt: '2025-08-20T10:00:00Z',
    updatedAt: '2026-09-10T08:00:00Z',
  },
  {
    id: 'usr-voter-002',
    email: 'maria.garcia@student.edu',
    fullName: 'Maria Garcia',
    phone: '+1-555-0102',
    studentId: 'STU-2024-1205',
    role: 'voter',
    avatar: '',
    isVerified: true,
    isActive: true,
    twoFactorEnabled: false,
    createdAt: '2025-09-01T12:00:00Z',
    updatedAt: '2026-09-05T10:00:00Z',
  },
  {
    id: 'usr-voter-003',
    email: 'james.wilson@student.edu',
    fullName: 'James Wilson',
    phone: '+1-555-0103',
    studentId: 'STU-2024-0934',
    role: 'voter',
    avatar: '',
    isVerified: true,
    isActive: true,
    twoFactorEnabled: false,
    createdAt: '2025-08-25T09:00:00Z',
    updatedAt: '2026-09-08T14:00:00Z',
  },
  {
    id: 'usr-voter-004',
    email: 'sophia.lee@student.edu',
    fullName: 'Sophia Lee',
    phone: '+1-555-0104',
    studentId: 'STU-2024-0678',
    role: 'voter',
    avatar: '',
    isVerified: true,
    isActive: true,
    twoFactorEnabled: false,
    createdAt: '2025-09-10T08:00:00Z',
    updatedAt: '2026-09-12T11:00:00Z',
  },
  {
    id: 'usr-voter-005',
    email: 'ethan.brown@student.edu',
    fullName: 'Ethan Brown',
    phone: '+1-555-0105',
    studentId: 'STU-2024-0412',
    role: 'voter',
    avatar: '',
    isVerified: true,
    isActive: true,
    twoFactorEnabled: false,
    createdAt: '2025-10-01T10:00:00Z',
    updatedAt: '2026-09-11T16:00:00Z',
  },
  {
    id: 'usr-voter-006',
    email: 'olivia.taylor@student.edu',
    fullName: 'Olivia Taylor',
    phone: '+1-555-0106',
    studentId: 'STU-2024-0567',
    role: 'voter',
    avatar: '',
    isVerified: true,
    isActive: true,
    twoFactorEnabled: false,
    createdAt: '2025-09-15T11:00:00Z',
    updatedAt: '2026-09-09T09:00:00Z',
  },
  {
    id: 'usr-voter-007',
    email: 'liam.martinez@student.edu',
    fullName: 'Liam Martinez',
    phone: '+1-555-0107',
    studentId: 'STU-2024-0789',
    role: 'voter',
    avatar: '',
    isVerified: false,
    isActive: true,
    twoFactorEnabled: false,
    createdAt: '2025-10-05T14:00:00Z',
    updatedAt: '2026-09-07T12:00:00Z',
  },
  {
    id: 'usr-voter-008',
    email: 'emma.anderson@student.edu',
    fullName: 'Emma Anderson',
    phone: '+1-555-0108',
    studentId: 'STU-2024-0345',
    role: 'voter',
    avatar: '',
    isVerified: true,
    isActive: false,
    twoFactorEnabled: false,
    createdAt: '2025-08-30T09:00:00Z',
    updatedAt: '2026-08-15T10:00:00Z',
  },
  {
    id: 'usr-voter-009',
    email: 'noah.thomas@student.edu',
    fullName: 'Noah Thomas',
    phone: '+1-555-0109',
    studentId: 'STU-2024-0234',
    role: 'voter',
    avatar: '',
    isVerified: true,
    isActive: true,
    twoFactorEnabled: false,
    createdAt: '2025-09-20T08:00:00Z',
    updatedAt: '2026-09-06T15:00:00Z',
  },
  {
    id: 'usr-voter-010',
    email: 'ava.jackson@student.edu',
    fullName: 'Ava Jackson',
    phone: '+1-555-0110',
    studentId: 'STU-2024-0123',
    role: 'voter',
    avatar: '',
    isVerified: true,
    isActive: true,
    twoFactorEnabled: false,
    createdAt: '2025-10-10T12:00:00Z',
    updatedAt: '2026-09-04T09:00:00Z',
  },
];

function seedDemoVoters(): void {
  const existing = safeGet<User[]>(KEYS.VOTERS, []);
  if (existing.length > 0) return;
  safeSet(KEYS.VOTERS, DEMO_VOTERS);
  safeSet(KEYS.VOTER_INIT, true);
}

export function initializeVoterStorage(): void {
  const initialized = safeGet<boolean>(KEYS.VOTER_INIT, false);
  if (!initialized) {
    seedDemoVoters();
  }
}

export function getVoters(filters?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): { items: User[]; total: number; page: number; limit: number; totalPages: number } {
  let voters = safeGet<User[]>(KEYS.VOTERS, []);

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    voters = voters.filter(
      (v) =>
        v.fullName.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q) ||
        (v.studentId?.toLowerCase().includes(q) ?? false)
    );
  }

  if (filters?.status) {
    voters = voters.filter((v) => {
      if (filters.status === 'verified') return v.isVerified;
      if (filters.status === 'unverified') return !v.isVerified;
      if (filters.status === 'active') return v.isActive;
      if (filters.status === 'inactive') return !v.isActive;
      return true;
    });
  }

  const page = filters?.page || 1;
  const limit = filters?.limit || 100;
  const total = voters.length;
  const totalPages = Math.ceil(total / limit);
  const items = voters.slice((page - 1) * limit, page * limit);

  return { items, total, page, limit, totalPages };
}

export function getVoterById(id: string): User | null {
  const voters = safeGet<User[]>(KEYS.VOTERS, []);
  return voters.find((v) => v.id === id) || null;
}

export function createVoter(data: {
  email: string;
  fullName: string;
  phone?: string;
  studentId?: string;
  department?: string;
}): User {
  const voters = safeGet<User[]>(KEYS.VOTERS, []);
  const now = new Date().toISOString();

  const voter: User = {
    id: `usr_${generateId()}`,
    email: data.email,
    fullName: data.fullName,
    phone: data.phone,
    studentId: data.studentId,
    role: 'voter',
    avatar: '',
    isVerified: true,
    isActive: true,
    twoFactorEnabled: false,
    createdAt: now,
    updatedAt: now,
  };

  voters.push(voter);
  safeSet(KEYS.VOTERS, voters);
  return voter;
}

export function updateVoter(id: string, data: Partial<User>): User | null {
  const voters = safeGet<User[]>(KEYS.VOTERS, []);
  const index = voters.findIndex((v) => v.id === id);
  if (index === -1) return null;

  voters[index] = { ...voters[index], ...data, updatedAt: new Date().toISOString() };
  safeSet(KEYS.VOTERS, voters);
  return voters[index];
}

export function deleteVoter(id: string): boolean {
  const voters = safeGet<User[]>(KEYS.VOTERS, []);
  const filtered = voters.filter((v) => v.id !== id);
  if (filtered.length === voters.length) return false;
  safeSet(KEYS.VOTERS, filtered);
  return true;
}

export function toggleVoterActive(id: string): User | null {
  const voters = safeGet<User[]>(KEYS.VOTERS, []);
  const index = voters.findIndex((v) => v.id === id);
  if (index === -1) return null;
  voters[index] = { ...voters[index], isActive: !voters[index].isActive, updatedAt: new Date().toISOString() };
  safeSet(KEYS.VOTERS, voters);
  return voters[index];
}

export function toggleVoterVerified(id: string): User | null {
  const voters = safeGet<User[]>(KEYS.VOTERS, []);
  const index = voters.findIndex((v) => v.id === id);
  if (index === -1) return null;
  voters[index] = { ...voters[index], isVerified: !voters[index].isVerified, updatedAt: new Date().toISOString() };
  safeSet(KEYS.VOTERS, voters);
  return voters[index];
}

export function getVoterCount(): number {
  const voters = safeGet<User[]>(KEYS.VOTERS, []);
  return voters.length;
}

export function resetDemoVoters(): void {
  localStorage.removeItem(KEYS.VOTERS);
  localStorage.removeItem(KEYS.VOTER_INIT);
  seedDemoVoters();
}
