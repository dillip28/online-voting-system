import { supabase } from '@/lib/supabaseClient';
import type { User } from '@/types';

function mapProfile(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    fullName: row.name as string,
    phone: (row.phone as string) ?? undefined,
    studentId: (row.student_id as string) ?? undefined,
    role: row.role as User['role'],
    avatar: (row.avatar_url as string) ?? undefined,
    isVerified: Boolean(row.is_verified),
    isActive: row.is_active !== false,
    twoFactorEnabled: Boolean(row.two_factor_enabled),
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) ?? (row.created_at as string),
  };
}

export async function getVoters(filters?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: User[]; total: number; page: number; limit: number; totalPages: number }> {
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('role', 'voter')
    .order('created_at', { ascending: true });

  if (filters?.search) {
    const q = filters.search.replace(/[%,]/g, ' ');
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,student_id.ilike.%${q}%`);
  }
  if (filters?.status === 'verified') query = query.eq('is_verified', true);
  if (filters?.status === 'unverified') query = query.eq('is_verified', false);
  if (filters?.status === 'active') query = query.eq('is_active', true);
  if (filters?.status === 'inactive') query = query.eq('is_active', false);

  const page = filters?.page || 1;
  const limit = filters?.limit || 100;
  const { data, count, error } = await query.range((page - 1) * limit, page * limit - 1);
  if (error) throw new Error(error.message);

  return {
    items: (data ?? []).map(mapProfile),
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function getVoterById(id: string): Promise<User | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProfile(data) : null;
}

export async function createVoter(data: {
  fullName: string;
  email: string;
  phone?: string;
  studentId?: string;
}): Promise<User> {
  const { data: row, error } = await supabase
    .from('profiles')
    .insert({
      id: crypto.randomUUID(),
      name: data.fullName,
      email: data.email,
      phone: data.phone || null,
      student_id: data.studentId || null,
      role: 'voter',
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapProfile(row);
}

export async function updateVoter(id: string, data: Partial<User>): Promise<User | null> {
  const update: Record<string, unknown> = {};
  if (data.fullName !== undefined) update.name = data.fullName;
  if (data.email !== undefined) update.email = data.email;
  if (data.phone !== undefined) update.phone = data.phone || null;
  if (data.studentId !== undefined) update.student_id = data.studentId || null;
  if (data.isVerified !== undefined) update.is_verified = data.isVerified;
  if (data.isActive !== undefined) update.is_active = data.isActive;
  update.updated_at = new Date().toISOString();

  const { data: row, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return row ? mapProfile(row) : null;
}

export async function deleteVoter(id: string): Promise<boolean> {
  const { data, error } = await supabase.from('profiles').delete().eq('id', id).select('id');
  if (error) throw new Error(error.message);
  return (data ?? []).length > 0;
}

export async function toggleVoterActive(id: string): Promise<User | null> {
  const voter = await getVoterById(id);
  if (!voter) return null;
  return updateVoter(id, { isActive: !voter.isActive });
}

export async function toggleVoterVerified(id: string): Promise<User | null> {
  const voter = await getVoterById(id);
  if (!voter) return null;
  return updateVoter(id, { isVerified: !voter.isVerified });
}

export async function getVoterCount(): Promise<number> {
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'voter');
  if (error) throw new Error(error.message);
  return count ?? 0;
}
