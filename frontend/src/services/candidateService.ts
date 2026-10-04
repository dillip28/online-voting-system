import { supabase } from '@/lib/supabaseClient';
import type { Candidate, CandidateStatus } from '@/types';
import { mapPositionRow } from '@/services/electionService';

interface CandidateRow {
  id: string;
  election_id: string | null;
  position_id: string;
  name: string;
  party: string | null;
  department: string | null;
  year: string | null;
  biography: string;
  manifesto: string;
  photo_url: string | null;
  status: CandidateStatus;
  votes_received: number;
  created_at: string;
  position?: Record<string, unknown> | null;
}

export function mapCandidateRow(row: CandidateRow): Candidate {
  return {
    id: row.id,
    electionId: row.election_id ?? '',
    positionId: row.position_id,
    position: row.position ? mapPositionRow(row.position as unknown as Parameters<typeof mapPositionRow>[0]) : undefined,
    name: row.name,
    photo: row.photo_url ?? undefined,
    party: row.party ?? undefined,
    department: row.department ?? undefined,
    year: row.year ?? undefined,
    biography: row.biography ?? '',
    manifesto: row.manifesto ?? '',
    status: row.status,
    votesReceived: row.votes_received,
    createdAt: row.created_at,
  };
}

export async function getCandidates(electionId?: string): Promise<Candidate[]> {
  let query = supabase.from('candidates').select('*, position:positions(*)').order('created_at', { ascending: true });
  if (electionId) query = query.eq('election_id', electionId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapCandidateRow(r as CandidateRow));
}

export async function getCandidateById(id: string): Promise<Candidate | null> {
  const { data, error } = await supabase
    .from('candidates')
    .select('*, position:positions(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapCandidateRow(data as CandidateRow) : null;
}

export async function createCandidate(data: {
  electionId: string;
  positionId: string;
  name: string;
  party?: string;
  department?: string;
  year?: string;
  biography: string;
  manifesto: string;
  photo?: string;
}): Promise<Candidate> {
  const { data: row, error } = await supabase
    .from('candidates')
    .insert({
      election_id: data.electionId,
      position_id: data.positionId,
      name: data.name,
      party: data.party || null,
      department: data.department || null,
      year: data.year || null,
      biography: data.biography,
      manifesto: data.manifesto,
      photo_url: data.photo || null,
      status: 'approved',
    })
    .select('*, position:positions(*)')
    .single();
  if (error) throw new Error(error.message);

  const { count } = await supabase
    .from('candidates')
    .select('id', { count: 'exact', head: true })
    .eq('election_id', data.electionId);
  await supabase.from('elections').update({ total_candidates: count ?? 0 }).eq('id', data.electionId);

  return mapCandidateRow(row as CandidateRow);
}

export async function updateCandidate(id: string, data: Partial<Candidate>): Promise<Candidate | null> {
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.party !== undefined) update.party = data.party || null;
  if (data.department !== undefined) update.department = data.department || null;
  if (data.year !== undefined) update.year = data.year || null;
  if (data.biography !== undefined) update.biography = data.biography;
  if (data.manifesto !== undefined) update.manifesto = data.manifesto;
  if (data.photo !== undefined) update.photo_url = data.photo || null;
  if (data.status !== undefined) update.status = data.status;
  if (data.positionId !== undefined) update.position_id = data.positionId;

  const { data: row, error } = await supabase
    .from('candidates')
    .update(update)
    .eq('id', id)
    .select('*, position:positions(*)')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return row ? mapCandidateRow(row as CandidateRow) : null;
}

export async function deleteCandidate(id: string): Promise<boolean> {
  const candidate = await getCandidateById(id);
  if (!candidate) return false;

  const { error } = await supabase.from('candidates').delete().eq('id', id);
  if (error) throw new Error(error.message);

  if (candidate.electionId) {
    const { count } = await supabase
      .from('candidates')
      .select('id', { count: 'exact', head: true })
      .eq('election_id', candidate.electionId);
    await supabase.from('elections').update({ total_candidates: count ?? 0 }).eq('id', candidate.electionId);
  }
  return true;
}
