import { supabase } from '@/lib/supabaseClient';
import type { AuditLog, UserRole } from '@/types';

export async function getAuditLogs(filters?: {
  search?: string;
  action?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: AuditLog[]; total: number; page: number; limit: number; totalPages: number }> {
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters?.search) {
    const q = filters.search.replace(/[%,]/g, ' ');
    query = query.or(`user_name.ilike.%${q}%,action.ilike.%${q}%,resource.ilike.%${q}%`);
  }
  if (filters?.action) query = query.eq('action', filters.action);

  const page = filters?.page || 1;
  const limit = filters?.limit || 100;
  const { data, count, error } = await query.range((page - 1) * limit, page * limit - 1);
  if (error) throw new Error(error.message);

  return {
    items: (data ?? []).map((r) => ({
      id: r.id as string,
      userId: (r.user_id as string) ?? '',
      userName: r.user_name as string,
      userRole: r.user_role as UserRole,
      action: r.action as string,
      resource: r.resource as string,
      resourceId: r.resource_id as string,
      details: (r.details as string) ?? undefined,
      ipAddress: (r.ip_address as string) ?? undefined,
      createdAt: r.created_at as string,
    })),
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function addAuditLog(entry: {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: string;
}): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    user_id: entry.userId && entry.userId !== 'admin' ? entry.userId : null,
    user_name: entry.userName,
    user_role: entry.userRole,
    action: entry.action,
    resource: entry.resource,
    resource_id: entry.resourceId,
    details: entry.details ?? null,
  });
  if (error) console.error('[audit] failed to log:', error.message);
}
