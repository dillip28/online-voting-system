import type { AuditLog } from '@/types';
import { generateId } from '@/lib/utils';

const KEYS = {
  AUDIT_LOGS: 'vs_audit_logs',
  AUDIT_INIT: 'vs_audit_initialized',
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

const DEMO_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    userId: 'usr-admin-001',
    userName: 'Sarah Williams',
    userRole: 'admin',
    action: 'election.create',
    resource: 'election',
    resourceId: 'elec_001',
    details: 'Created election: Student Council President 2026',
    ipAddress: '192.168.1.10',
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'log-002',
    userId: 'usr-admin-001',
    userName: 'Sarah Williams',
    userRole: 'admin',
    action: 'election.schedule',
    resource: 'election',
    resourceId: 'elec_003',
    details: 'Scheduled election: Club Secretary Election',
    ipAddress: '192.168.1.10',
    createdAt: '2026-09-01T09:00:00Z',
  },
  {
    id: 'log-003',
    userId: 'usr-admin-001',
    userName: 'Sarah Williams',
    userRole: 'admin',
    action: 'candidate.approve',
    resource: 'candidate',
    resourceId: 'cand_001',
    details: 'Approved candidacy of Alex Rivera for President',
    ipAddress: '192.168.1.10',
    createdAt: '2026-08-10T09:30:00Z',
  },
  {
    id: 'log-004',
    userId: 'usr-voter-001',
    userName: 'Alex Johnson',
    userRole: 'voter',
    action: 'vote.submit',
    resource: 'vote',
    resourceId: 'vote-001',
    details: 'Vote submitted for Student Council President 2026',
    ipAddress: '192.168.1.45',
    createdAt: '2026-09-10T14:22:00Z',
  },
  {
    id: 'log-005',
    userId: 'usr-admin-001',
    userName: 'Sarah Williams',
    userRole: 'admin',
    action: 'results.publish',
    resource: 'election',
    resourceId: 'elec_005',
    details: 'Published results for Best Student Award 2025',
    ipAddress: '192.168.1.10',
    createdAt: '2025-12-15T12:00:00Z',
  },
  {
    id: 'log-006',
    userId: 'usr-superadmin-001',
    userName: 'David Admin',
    userRole: 'super_admin',
    action: 'user.login',
    resource: 'user',
    resourceId: 'usr-superadmin-001',
    details: 'Super admin login',
    ipAddress: '10.0.0.55',
    createdAt: '2026-09-14T09:00:00Z',
  },
];

function seedDemoAuditLogs(): void {
  const existing = safeGet<AuditLog[]>(KEYS.AUDIT_LOGS, []);
  if (existing.length > 0) return;
  safeSet(KEYS.AUDIT_LOGS, DEMO_AUDIT_LOGS);
  safeSet(KEYS.AUDIT_INIT, true);
}

export function initializeAuditStorage(): void {
  const initialized = safeGet<boolean>(KEYS.AUDIT_INIT, false);
  if (!initialized) {
    seedDemoAuditLogs();
  }
}

export function getAuditLogs(filters?: {
  search?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): { items: AuditLog[]; total: number; page: number; limit: number; totalPages: number } {
  let logs = safeGet<AuditLog[]>(KEYS.AUDIT_LOGS, []);

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.userName.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.resource.toLowerCase().includes(q) ||
        (l.details?.toLowerCase().includes(q) ?? false)
    );
  }

  if (filters?.action) {
    logs = logs.filter((l) => l.action === filters.action);
  }

  if (filters?.startDate) {
    const start = new Date(filters.startDate);
    logs = logs.filter((l) => new Date(l.createdAt) >= start);
  }

  if (filters?.endDate) {
    const end = new Date(filters.endDate + 'T23:59:59');
    logs = logs.filter((l) => new Date(l.createdAt) <= end);
  }

  logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const page = filters?.page || 1;
  const limit = filters?.limit || 100;
  const total = logs.length;
  const totalPages = Math.ceil(total / limit);
  const items = logs.slice((page - 1) * limit, page * limit);

  return { items, total, page, limit, totalPages };
}

export function addAuditLog(data: {
  userId: string;
  userName: string;
  userRole: 'voter' | 'admin' | 'super_admin';
  action: string;
  resource: string;
  resourceId: string;
  details?: string;
}): AuditLog {
  const logs = safeGet<AuditLog[]>(KEYS.AUDIT_LOGS, []);

  const log: AuditLog = {
    id: `log_${generateId()}`,
    userId: data.userId,
    userName: data.userName,
    userRole: data.userRole,
    action: data.action,
    resource: data.resource,
    resourceId: data.resourceId,
    details: data.details,
    ipAddress: '127.0.0.1',
    createdAt: new Date().toISOString(),
  };

  logs.push(log);
  safeSet(KEYS.AUDIT_LOGS, logs);
  return log;
}

export function getAuditLogCount(): number {
  const logs = safeGet<AuditLog[]>(KEYS.AUDIT_LOGS, []);
  return logs.length;
}

export function resetDemoAuditLogs(): void {
  localStorage.removeItem(KEYS.AUDIT_LOGS);
  localStorage.removeItem(KEYS.AUDIT_INIT);
  seedDemoAuditLogs();
}
