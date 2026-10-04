import { supabase } from '@/lib/supabaseClient';
import type { Election, ElectionStatus, ElectionType } from '@/types';
import type { Position } from '@/types';

interface ElectionFilters {
  status?: ElectionStatus;
  search?: string;
  page?: number;
  limit?: number;
}

interface PositionRow {
  id: string;
  election_id: string;
  name: string;
  description: string | null;
  display_order: number;
  max_selections: number;
}

interface ElectionRow {
  id: string;
  title: string;
  description: string | null;
  type: string;
  organization: string;
  status: ElectionStatus;
  start_time: string | null;
  end_time: string | null;
  created_by: string;
  total_positions: number;
  total_candidates: number;
  eligible_voters: number;
  votes_cast: number;
  enable_nota: boolean;
  max_selections: number;
  published_results: boolean;
  created_at: string;
  updated_at: string;
  positions?: PositionRow[];
}

export function mapPositionRow(row: PositionRow): Position {
  return {
    id: row.id,
    electionId: row.election_id,
    title: row.name,
    description: row.description ?? '',
    maxSelections: row.max_selections,
    order: row.display_order,
  };
}

export function mapElectionRow(row: ElectionRow): Election {
  const base: Election = {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    type: row.type as ElectionType,
    organization: row.organization,
    status: row.status,
    startDate: row.start_time ?? '',
    endDate: row.end_time ?? '',
    createdBy: row.created_by,
    totalPositions: row.total_positions,
    totalCandidates: row.total_candidates,
    eligibleVoters: row.eligible_voters,
    votesCast: row.votes_cast,
    enableNota: row.enable_nota,
    maxSelections: row.max_selections,
    publishedResults: row.published_results,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    positions: (row.positions ?? [])
      .map(mapPositionRow)
      .sort((a, b) => a.order - b.order),
  };
  return { ...base, status: computeElectionStatus(base) };
}

export function computeElectionStatus(election: Election): ElectionStatus {
  if (election.status === 'results_published' || election.status === 'archived') {
    return election.status;
  }
  if (election.status === 'closed') return 'closed';
  if (election.status === 'active') return 'active';
  if (election.status === 'draft') return 'draft';
  if (election.status === 'scheduled') {
    const now = new Date();
    const start = new Date(election.startDate);
    if (!Number.isNaN(start.getTime()) && now >= start) return 'active';
    return 'scheduled';
  }
  return election.status;
}

export async function getElections(filters?: ElectionFilters): Promise<{
  items: Election[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  let query = supabase
    .from('elections')
    .select('*, positions(*)', { count: 'exact' })
    .order('created_at', { ascending: true });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.search) {
    const q = filters.search.replace(/[%,]/g, ' ');
    query = query.or(`title.ilike.%${q}%,organization.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const page = filters?.page || 1;
  const limit = filters?.limit || 100;
  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    items: (data ?? []).map((r) => mapElectionRow(r as ElectionRow)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getElectionById(id: string): Promise<Election | null> {
  const { data, error } = await supabase
    .from('elections')
    .select('*, positions(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapElectionRow(data as ElectionRow) : null;
}

export async function createElection(data: {
  title: string;
  description: string;
  type: string;
  organization: string;
  startDate: string;
  endDate: string;
  enableNota: boolean;
  maxSelections: number;
  createdBy: string;
  positions: Position[];
  candidates?: Record<string, unknown>[];
}): Promise<Election> {
  const { data: row, error } = await supabase
    .from('elections')
    .insert({
      title: data.title,
      description: data.description,
      type: data.type,
      organization: data.organization,
      status: 'draft',
      start_time: data.startDate || null,
      end_time: data.endDate || null,
      created_by: data.createdBy,
      enable_nota: data.enableNota,
      max_selections: data.maxSelections,
      total_positions: data.positions.length,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  let serverPositions: PositionRow[] = [];
  if (data.positions.length > 0) {
    const { data: rows, error: posError } = await supabase.from('positions').insert(
      data.positions.map((p, i) => ({
        election_id: row.id,
        name: p.title,
        description: p.description ?? '',
        display_order: p.order ?? i,
        max_selections: p.maxSelections ?? 1,
      }))
    ).select();
    if (posError) throw new Error(posError.message);
    serverPositions = (rows ?? []) as PositionRow[];
  }

  if (data.candidates && data.candidates.length > 0) {
    const clientToServer = new Map<string, string>();
    data.positions.forEach((p, i) => {
      if (serverPositions[i]) clientToServer.set(p.id, serverPositions[i].id);
    });
    const rows = data.candidates
      .map((c: Record<string, unknown>) => {
        const clientPositionId = (c.positionId as string) || '';
        const positionId = clientToServer.get(clientPositionId) ?? null;
        if (!positionId) return null;
        return {
          election_id: row.id,
          position_id: positionId,
          name: c.name as string,
          party: (c.party as string) || null,
          biography: (c.biography as string) ?? '',
          manifesto: (c.manifesto as string) ?? '',
          photo_url: (c.photo as string) || null,
          status: 'approved',
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
    if (rows.length > 0) {
      const { error: candError } = await supabase.from('candidates').insert(rows);
      if (candError) throw new Error(candError.message);
      await supabase
        .from('elections')
        .update({ total_candidates: rows.length })
        .eq('id', row.id);
    }
  }

  const election = await getElectionById(row.id);
  return election as Election;
}

export async function updateElection(id: string, data: Partial<Election>): Promise<Election | null> {
  const update: Record<string, unknown> = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.description !== undefined) update.description = data.description;
  if (data.type !== undefined) update.type = data.type;
  if (data.organization !== undefined) update.organization = data.organization;
  if (data.status !== undefined) update.status = data.status;
  if (data.startDate !== undefined) update.start_time = data.startDate || null;
  if (data.endDate !== undefined) update.end_time = data.endDate || null;
  if (data.eligibleVoters !== undefined) update.eligible_voters = data.eligibleVoters;
  if (data.votesCast !== undefined) update.votes_cast = data.votesCast;
  if (data.enableNota !== undefined) update.enable_nota = data.enableNota;
  if (data.maxSelections !== undefined) update.max_selections = data.maxSelections;
  if (data.publishedResults !== undefined) update.published_results = data.publishedResults;

  const { error } = await supabase.from('elections').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  return getElectionById(id);
}

export async function deleteElection(id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('elections')
    .delete()
    .eq('id', id)
    .select('id');
  if (error) throw new Error(error.message);
  return (data ?? []).length > 0;
}

export async function publishElection(id: string) { return updateElection(id, { status: 'scheduled' }); }
export async function unpublishElection(id: string) { return updateElection(id, { status: 'draft' }); }
export async function openElection(id: string) { return updateElection(id, { status: 'active' }); }
export async function closeElection(id: string) { return updateElection(id, { status: 'closed' }); }
export async function scheduleElection(id: string) { return updateElection(id, { status: 'scheduled' }); }
export async function publishResults(id: string) {
  return updateElection(id, { status: 'results_published', publishedResults: true });
}

// ─── Results (aggregated by the database; no raw vote rows leave the server) ───

export interface ElectionResults {
  electionId: string;
  electionTitle: string;
  electionStatus: string;
  totalEligibleVoters: number;
  totalVotesCast: number;
  turnoutPercentage: number;
  positions: {
    positionId: string;
    positionTitle: string;
    positionDescription: string | null;
    candidates: {
      candidateId: string | null;
      name: string;
      photoUrl: string | null;
      party: string | null;
      votes: number;
      percentage: number;
      rank: number;
      isWinner: boolean;
    }[];
    totalVotes: number;
    notaVotes: number;
  }[];
}

export async function getElectionResults(electionId: string): Promise<ElectionResults | null> {
  const { data, error } = await supabase.rpc('get_election_results', { p_election_id: electionId });
  if (error) {
    if (error.message.includes('not found')) return null;
    throw new Error(error.message);
  }
  return data as ElectionResults;
}

export async function getDashboardStats(): Promise<{
  stats: {
    totalVoters: number;
    verifiedVoters: number;
    activeElections: number;
    upcomingElections: number;
    completedElections: number;
    totalVotesCast: number;
    turnoutPercentage: number;
  };
  recentElections: { id: string; title: string; status: string; totalVotes: number }[];
  recentAuditLogs: {
    id: string;
    action: string;
    actorEmail: string;
    actorName: string;
    targetType: string;
    createdAt: string;
  }[];
  votesPerElection: { name: string; votes: number }[];
  statusDistribution: Record<string, number>;
}> {
  const { items: elections } = await getElections({ limit: 100 });

  const [{ data: voteCounts }, { count: voterCount }, { data: participation }] = await Promise.all([
    supabase.from('election_vote_counts').select('election_id, total_votes'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'voter'),
    supabase.from('election_participation').select('election_id, participating_voters'),
  ]);

  const votesByElection = new Map<string, number>();
  const participationByElection = new Map<string, number>();
  for (const row of (voteCounts ?? []) as { election_id: string; total_votes: number }[]) {
    votesByElection.set(row.election_id, row.total_votes);
  }
  for (const row of (participation ?? []) as { election_id: string; participating_voters: number }[]) {
    participationByElection.set(row.election_id, row.participating_voters);
  }
  let totalBallots = 0;
  for (const v of participationByElection.values()) totalBallots += v;

  let activeElections = 0;
  let upcomingElections = 0;
  let completedElections = 0;
  const statusDistribution: Record<string, number> = {};
  const votesPerElection: { name: string; votes: number }[] = [];

  for (const election of elections) {
    const status = election.status;
    statusDistribution[status] = (statusDistribution[status] || 0) + 1;

    if (status === 'active') activeElections++;
    else if (status === 'scheduled') upcomingElections++;
    else if (status === 'closed' || status === 'results_published') completedElections++;

    const electionVotes = votesByElection.get(election.id) ?? 0;
    votesPerElection.push({
      name: election.title.length > 20 ? election.title.slice(0, 20) + '...' : election.title,
      votes: electionVotes,
    });
  }

  const totalVoters = voterCount ?? 0;

  return {
    stats: {
      totalVoters,
      verifiedVoters: totalVoters,
      activeElections,
      upcomingElections,
      completedElections,
      totalVotesCast: totalBallots,
      turnoutPercentage:
        totalVoters > 0 ? Math.round((totalBallots / totalVoters) * 100) : 0,
    },
    recentElections: elections.slice(-5).reverse().map((e) => ({
      id: e.id,
      title: e.title,
      status: e.status,
      totalVotes: votesByElection.get(e.id) ?? 0,
    })),
    recentAuditLogs: [],
    votesPerElection,
    statusDistribution,
  };
}

