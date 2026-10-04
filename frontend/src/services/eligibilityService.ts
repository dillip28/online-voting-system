import { supabase } from '@/lib/supabaseClient';
import type { Election } from '@/types';

export type ElectionAvailability =
  | 'not_eligible'
  | 'not_started'
  | 'active'
  | 'closed'
  | 'already_voted'
  | 'eligible';

export interface VoterElectionAccess {
  electionId: string;
  eligible: boolean;
  hasVoted: boolean;
  availability: ElectionAvailability;
}

const availabilityLabels: Record<ElectionAvailability, string> = {
  not_eligible: 'Not Eligible',
  not_started: 'Not Started',
  active: 'Election Active',
  closed: 'Election Closed',
  already_voted: 'Already Voted',
  eligible: 'Eligible',
};

export function getAvailabilityLabel(state: ElectionAvailability): string {
  return availabilityLabels[state];
}

interface EligibilityRow {
  election_id: string;
  user_id: string;
  eligible: boolean;
  has_voted: boolean;
}

export async function getEligibilityForUser(userId: string): Promise<Map<string, EligibilityRow>> {
  const { data, error } = await supabase
    .from('voter_eligibility')
    .select('election_id, user_id, eligible, has_voted')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  const map = new Map<string, EligibilityRow>();
  for (const row of data ?? []) {
    map.set((row as EligibilityRow).election_id, row as EligibilityRow);
  }
  return map;
}

export function computeAvailability(
  election: Pick<Election, 'status' | 'startDate' | 'endDate'>,
  eligibility: { eligible: boolean; hasVoted: boolean } | null
): ElectionAvailability {
  if (!eligibility || !eligibility.eligible) return 'not_eligible';
  if (eligibility.hasVoted) return 'already_voted';

  const now = new Date();

  if (election.status === 'closed' || election.status === 'results_published' || election.status === 'archived') {
    return 'closed';
  }
  if (election.status === 'draft') {
    return 'not_started';
  }

  const start = election.startDate ? new Date(election.startDate) : null;
  const end = election.endDate ? new Date(election.endDate) : null;

  if (start && now < start) return 'not_started';
  if (end && now > end) return 'closed';

  if (election.status === 'scheduled' || election.status === 'active') {
    return 'active';
  }
  return 'eligible';
}

export async function getVoterElectionAccess(userId: string, elections: Election[]): Promise<Map<string, VoterElectionAccess>> {
  const eligibility = await getEligibilityForUser(userId).catch(() => new Map<string, EligibilityRow>());
  const result = new Map<string, VoterElectionAccess>();
  for (const election of elections) {
    const row = eligibility.get(election.id) ?? null;
    const access = row
      ? { eligible: row.eligible, hasVoted: row.has_voted }
      : null;
    result.set(election.id, {
      electionId: election.id,
      eligible: access?.eligible ?? false,
      hasVoted: access?.hasVoted ?? false,
      availability: computeAvailability(election, access),
    });
  }
  return result;
}
