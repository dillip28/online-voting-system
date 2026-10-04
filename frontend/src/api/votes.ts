import { supabase } from '@/lib/supabaseClient';
import type { ApiResponse, VoteHistory } from '@/types';
import { useAuthStore } from '@/store/auth-store';

interface SubmitBallotData {
  electionId: string;
  choices: { positionId: string; candidateId: string | null }[];
}

export const votesApi = {
  async submitBallot(data: SubmitBallotData): Promise<ApiResponse<{
    success: boolean;
    alreadyVoted?: boolean;
    ballotId?: string;
    confirmationToken?: string;
    message: string;
    votedAt?: string;
  }>> {
    const user = useAuthStore.getState().user;
    if (!user) {
      return { data: { success: false, message: 'You must be signed in to vote' }, success: true };
    }

    const selections = data.choices
      .filter((c) => c.candidateId !== null)
      .map((c) => ({ position_id: c.positionId, candidate_id: c.candidateId }));

    if (selections.length === 0) {
      return { data: { success: false, message: 'No selections provided' }, success: true };
    }

    const { data: result, error } = await supabase.rpc('submit_ballot', {
      p_election_id: data.electionId,
      p_selections: selections,
    });

    if (error) {
      const message = error.message || 'Failed to submit vote';
      return {
        data: {
          success: false,
          alreadyVoted: message.includes('already voted'),
          message,
        },
        success: true,
      };
    }

    const payload = result as { confirmation_id?: string; voted_at?: string };
    return {
      data: {
        success: true,
        ballotId: `ballot_${Date.now()}`,
        confirmationToken: payload.confirmation_id,
        message: 'Vote submitted successfully',
        votedAt: payload.voted_at,
      },
      success: true,
    };
  },

  async getVotingStatus(electionId: string): Promise<ApiResponse<{
    electionId: string;
    electionTitle: string;
    electionStatus: string;
    startTime: string;
    endTime: string;
    isEligible: boolean;
    hasVoted: boolean;
    votedAt: string | null;
  }>> {
    const user = useAuthStore.getState().user;
    const { getElectionById } = await import('@/services/electionService');
    const election = await getElectionById(electionId);
    if (!election) throw new Error('Election not found');

    let isEligible = false;
    let hasVoted = false;
    if (user) {
      const { data } = await supabase
        .from('voter_eligibility')
        .select('eligible, has_voted')
        .eq('election_id', electionId)
        .eq('user_id', user.id)
        .maybeSingle();
      isEligible = data?.eligible ?? false;
      hasVoted = data?.has_voted ?? false;
    }

    return {
      data: {
        electionId,
        electionTitle: election.title,
        electionStatus: election.status,
        startTime: election.startDate,
        endTime: election.endDate,
        isEligible,
        hasVoted,
        votedAt: null,
      },
      success: true,
    };
  },

  async getVotingHistory(): Promise<ApiResponse<{
    items: VoteHistory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    const user = useAuthStore.getState().user;
    if (!user) {
      return { data: { items: [], total: 0, page: 1, limit: 20, totalPages: 0 }, success: true };
    }

    const { data, error } = await supabase
      .from('votes')
      .select('election_id, created_at, elections(title, type, end_time)')
      .eq('voter_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const seen = new Set<string>();
    const rows = (data ?? []).filter((r) => {
      if (seen.has(r.election_id as string)) return false;
      seen.add(r.election_id as string);
      return true;
    });

    return {
      data: {
        items: rows.map((r, i) => {
          const election = (Array.isArray(r.elections) ? r.elections[0] : r.elections) as { title?: string; type?: string; end_time?: string } | null;
          return {
            id: `${r.election_id}_${i}`,
            election: {
              id: r.election_id as string,
              title: election?.title ?? 'Election',
              type: (election?.type as VoteHistory['election']['type']) ?? 'custom',
              endDate: election?.end_time ?? '',
            },
            confirmationId: `CONFIRM-${(r.election_id as string).slice(0, 8).toUpperCase()}`,
            status: 'submitted' as const,
            submittedAt: r.created_at as string,
          };
        }),
        total: rows.length,
        page: 1,
        limit: 20,
        totalPages: Math.max(1, Math.ceil(rows.length / 20)),
      },
      success: true,
    };
  },
};
