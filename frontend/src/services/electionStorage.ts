import type { Election, Candidate, ElectionStatus, Position } from '@/types';
import { generateId } from '@/lib/utils';
import { mockElections } from '@/mocks/elections';
import { mockCandidates } from '@/mocks/candidates';

const KEYS = {
  ELECTIONS: 'vs_elections',
  CANDIDATES: 'vs_candidates',
  VOTES: 'vs_votes',
  VOTED_USERS: 'vs_voted_users',
  INITIALIZED: 'vs_initialized',
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
  } catch {
    // Storage full or unavailable
  }
}

export function computeElectionStatus(election: Election): ElectionStatus {
  if (election.status === 'results_published' || election.status === 'archived') {
    return election.status;
  }
  if (election.status === 'draft') {
    return 'draft';
  }
  const now = new Date();
  const start = new Date(election.startDate);
  const end = new Date(election.endDate);

  if (!election.publishedResults && election.status === 'closed') {
    return 'closed';
  }

  if (now < start) return 'scheduled';
  if (now >= start && now <= end) return 'active';
  if (now > end) return 'closed';
  return election.status;
}

function seedDemoData(): void {
  const existingElections = safeGet<Election[]>(KEYS.ELECTIONS, []);
  if (existingElections.length > 0) return;

  const elections = mockElections.map((e) => ({
    ...e,
    publishedResults: e.status === 'results_published',
  }));
  safeSet(KEYS.ELECTIONS, elections);
  safeSet(KEYS.CANDIDATES, mockCandidates);
  safeSet(KEYS.VOTES, {});
  safeSet(KEYS.VOTED_USERS, {});
  safeSet(KEYS.INITIALIZED, true);
}

export function initializeStorage(): void {
  const initialized = safeGet<boolean>(KEYS.INITIALIZED, false);
  if (!initialized) {
    seedDemoData();
  }
}

// ─── Elections ───────────────────────────────────────────────

export function getElections(filters?: {
  status?: ElectionStatus;
  search?: string;
  page?: number;
  limit?: number;
}): { items: Election[]; total: number; page: number; limit: number; totalPages: number } {
  let elections = safeGet<Election[]>(KEYS.ELECTIONS, []);

  elections = elections.map((e) => ({
    ...e,
    status: computeElectionStatus(e),
  }));

  if (filters?.status) {
    elections = elections.filter((e) => e.status === filters.status);
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    elections = elections.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.organization.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
    );
  }

  const page = filters?.page || 1;
  const limit = filters?.limit || 100;
  const total = elections.length;
  const totalPages = Math.ceil(total / limit);
  const items = elections.slice((page - 1) * limit, page * limit);

  return { items, total, page, limit, totalPages };
}

export function getElectionById(id: string): Election | null {
  const elections = safeGet<Election[]>(KEYS.ELECTIONS, []);
  const election = elections.find((e) => e.id === id);
  if (!election) return null;
  return { ...election, status: computeElectionStatus(election) };
}

export function createElection(data: {
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
  candidates?: Candidate[];
}): Election {
  const elections = safeGet<Election[]>(KEYS.ELECTIONS, []);
  const now = new Date().toISOString();

  const election: Election = {
    id: `elec_${generateId()}`,
    title: data.title,
    description: data.description,
    type: data.type as Election['type'],
    organization: data.organization,
    status: 'draft',
    startDate: data.startDate,
    endDate: data.endDate,
    createdBy: data.createdBy,
    totalPositions: data.positions.length,
    totalCandidates: data.candidates?.length || 0,
    eligibleVoters: 0,
    votesCast: 0,
    enableNota: data.enableNota,
    maxSelections: data.maxSelections,
    publishedResults: false,
    createdAt: now,
    updatedAt: now,
    positions: data.positions,
  };

  elections.push(election);
  safeSet(KEYS.ELECTIONS, elections);

  if (data.candidates && data.candidates.length > 0) {
    const candidates = safeGet<Candidate[]>(KEYS.CANDIDATES, []);
    const newCandidates = data.candidates.map((c) => ({
      ...c,
      id: c.id || `cand_${generateId()}`,
      electionId: election.id,
      votesReceived: 0,
      createdAt: now,
      status: c.status || 'approved' as const,
    }));
    candidates.push(...newCandidates);
    safeSet(KEYS.CANDIDATES, candidates);
  }

  return election;
}

export function updateElection(id: string, data: Partial<Election>): Election | null {
  const elections = safeGet<Election[]>(KEYS.ELECTIONS, []);
  const index = elections.findIndex((e) => e.id === id);
  if (index === -1) return null;

  elections[index] = {
    ...elections[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  safeSet(KEYS.ELECTIONS, elections);
  return elections[index];
}

export function deleteElection(id: string): boolean {
  const elections = safeGet<Election[]>(KEYS.ELECTIONS, []);
  const filtered = elections.filter((e) => e.id !== id);
  if (filtered.length === elections.length) return false;

  safeSet(KEYS.ELECTIONS, filtered);

  const candidates = safeGet<Candidate[]>(KEYS.CANDIDATES, []);
  safeSet(KEYS.CANDIDATES, candidates.filter((c) => c.electionId !== id));

  const votes = safeGet<Record<string, Record<string, number>>>(KEYS.VOTES, {});
  delete votes[id];
  safeSet(KEYS.VOTES, votes);

  const votedUsers = safeGet<Record<string, string[]>>(KEYS.VOTED_USERS, {});
  delete votedUsers[id];
  safeSet(KEYS.VOTED_USERS, votedUsers);

  return true;
}

export function publishElection(id: string): Election | null {
  return updateElection(id, { status: 'scheduled' });
}

export function unpublishElection(id: string): Election | null {
  return updateElection(id, { status: 'draft' });
}

export function openElection(id: string): Election | null {
  return updateElection(id, { status: 'active' });
}

export function closeElection(id: string): Election | null {
  return updateElection(id, { status: 'closed' });
}

export function scheduleElection(id: string): Election | null {
  return updateElection(id, { status: 'scheduled' });
}

export function publishResults(id: string): Election | null {
  return updateElection(id, { status: 'results_published', publishedResults: true });
}

// ─── Candidates ──────────────────────────────────────────────

export function getCandidates(electionId?: string): Candidate[] {
  const candidates = safeGet<Candidate[]>(KEYS.CANDIDATES, []);
  if (electionId) {
    return candidates.filter((c) => c.electionId === electionId);
  }
  return candidates;
}

export function getCandidateById(id: string): Candidate | null {
  const candidates = safeGet<Candidate[]>(KEYS.CANDIDATES, []);
  return candidates.find((c) => c.id === id) || null;
}

export function createCandidate(data: {
  electionId: string;
  positionId: string;
  name: string;
  party?: string;
  biography: string;
  manifesto: string;
  photo?: string;
}): Candidate {
  const candidates = safeGet<Candidate[]>(KEYS.CANDIDATES, []);
  const now = new Date().toISOString();

  const candidate: Candidate = {
    id: `cand_${generateId()}`,
    electionId: data.electionId,
    positionId: data.positionId,
    name: data.name,
    party: data.party,
    biography: data.biography,
    manifesto: data.manifesto,
    photo: data.photo,
    status: 'approved',
    votesReceived: 0,
    createdAt: now,
  };

  candidates.push(candidate);
  safeSet(KEYS.CANDIDATES, candidates);

  updateElectionCandidateCount(data.electionId);

  return candidate;
}

export function updateCandidate(id: string, data: Partial<Candidate>): Candidate | null {
  const candidates = safeGet<Candidate[]>(KEYS.CANDIDATES, []);
  const index = candidates.findIndex((c) => c.id === id);
  if (index === -1) return null;

  candidates[index] = { ...candidates[index], ...data };
  safeSet(KEYS.CANDIDATES, candidates);
  return candidates[index];
}

export function deleteCandidate(id: string): boolean {
  const candidates = safeGet<Candidate[]>(KEYS.CANDIDATES, []);
  const candidate = candidates.find((c) => c.id === id);
  if (!candidate) return false;

  const filtered = candidates.filter((c) => c.id !== id);
  safeSet(KEYS.CANDIDATES, filtered);

  updateElectionCandidateCount(candidate.electionId);

  return true;
}

function updateElectionCandidateCount(electionId: string): void {
  const candidates = safeGet<Candidate[]>(KEYS.CANDIDATES, []);
  const count = candidates.filter((c) => c.electionId === electionId).length;
  updateElection(electionId, { totalCandidates: count });
}

// ─── Votes ───────────────────────────────────────────────────

export function getVotes(electionId: string): Record<string, number> {
  const votes = safeGet<Record<string, Record<string, number>>>(KEYS.VOTES, {});
  return votes[electionId] || {};
}

export function getVoteCount(electionId: string): number {
  const candidateVotes = getVotes(electionId);
  return Object.values(candidateVotes).reduce((sum, count) => sum + count, 0);
}

export function saveVote(
  electionId: string,
  voterId: string,
  selections: { positionId: string; candidateId: string | null; isNota: boolean }[]
): { success: boolean; alreadyVoted?: boolean; confirmationId?: string; votedAt?: string } {
  const votedUsers = safeGet<Record<string, string[]>>(KEYS.VOTED_USERS, {});
  const voters = votedUsers[electionId] || [];

  if (voters.includes(voterId)) {
    return { success: false, alreadyVoted: true };
  }

  const votes = safeGet<Record<string, Record<string, number>>>(KEYS.VOTES, {});
  if (!votes[electionId]) votes[electionId] = {};

  for (const selection of selections) {
    if (selection.candidateId && !selection.isNota) {
      votes[electionId][selection.candidateId] =
        (votes[electionId][selection.candidateId] || 0) + 1;
    }
  }
  safeSet(KEYS.VOTES, votes);

  voters.push(voterId);
  votedUsers[electionId] = voters;
  safeSet(KEYS.VOTED_USERS, votedUsers);

  const candidates = safeGet<Candidate[]>(KEYS.CANDIDATES, []);
  for (const selection of selections) {
    if (selection.candidateId && !selection.isNota) {
      const idx = candidates.findIndex((c) => c.id === selection.candidateId);
      if (idx !== -1) {
        candidates[idx].votesReceived = (candidates[idx].votesReceived || 0) + 1;
      }
    }
  }
  safeSet(KEYS.CANDIDATES, candidates);

  const totalVotes = getVoteCount(electionId);
  updateElection(electionId, { votesCast: totalVotes });

  const now = new Date().toISOString();
  const confirmationId = `CONFIRM-${Date.now().toString(36).toUpperCase()}`;

  return { success: true, confirmationId, votedAt: now };
}

export function hasUserVoted(electionId: string, voterId: string): boolean {
  const votedUsers = safeGet<Record<string, string[]>>(KEYS.VOTED_USERS, {});
  const voters = votedUsers[electionId] || [];
  return voters.includes(voterId);
}

export function getVotingHistory(voterId: string): {
  electionId: string;
  electionTitle: string;
  confirmationId: string;
  status: string;
  votedAt: string;
}[] {
  const votedUsers = safeGet<Record<string, string[]>>(KEYS.VOTED_USERS, {});
  const elections = safeGet<Election[]>(KEYS.ELECTIONS, []);
  const history: {
    electionId: string;
    electionTitle: string;
    confirmationId: string;
    status: string;
    votedAt: string;
  }[] = [];

  for (const [electionId, voters] of Object.entries(votedUsers)) {
    if (voters.includes(voterId)) {
      const election = elections.find((e) => e.id === electionId);
      history.push({
        electionId,
        electionTitle: election?.title || 'Unknown Election',
        confirmationId: `CONFIRM-${electionId.slice(0, 8).toUpperCase()}`,
        status: 'submitted',
        votedAt: election?.updatedAt || new Date().toISOString(),
      });
    }
  }

  return history;
}

// ─── Results ─────────────────────────────────────────────────

export function getElectionResults(electionId: string): {
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
} | null {
  const election = getElectionById(electionId);
  if (!election) return null;

  const candidates = getCandidates(electionId);
  const electionVotes = getVotes(electionId);
  const totalVotesCast = Object.values(electionVotes).reduce((s, v) => s + v, 0);

  const positions = (election.positions || []).map((pos) => {
    const posCandidates = candidates.filter((c) => c.positionId === pos.id);
    const posVotes = posCandidates.map((c) => ({
      candidateId: c.id,
      name: c.name,
      photoUrl: c.photo || null,
      party: c.party || null,
      votes: electionVotes[c.id] || 0,
      percentage: 0,
      rank: 0,
      isWinner: false,
    }));

    const totalPosVotes = posVotes.reduce((s, v) => s + v.votes, 0);
    posVotes.sort((a, b) => b.votes - a.votes);
    posVotes.forEach((v, i) => {
      v.rank = i + 1;
      v.percentage = totalPosVotes > 0 ? (v.votes / totalPosVotes) * 100 : 0;
      v.isWinner = i === 0 && v.votes > 0;
    });

    return {
      positionId: pos.id,
      positionTitle: pos.title,
      positionDescription: pos.description || null,
      candidates: posVotes,
      totalVotes: totalPosVotes,
      notaVotes: 0,
    };
  });

  return {
    electionId,
    electionTitle: election.title,
    electionStatus: election.status,
    totalEligibleVoters: election.eligibleVoters || 0,
    totalVotesCast,
    turnoutPercentage:
      (election.eligibleVoters || 0) > 0
        ? (totalVotesCast / (election.eligibleVoters || 1)) * 100
        : 0,
    positions,
  };
}

// ─── Dashboard Stats ─────────────────────────────────────────

export function getDashboardStats(): {
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
} {
  const elections = safeGet<Election[]>(KEYS.ELECTIONS, []).map((e) => ({
    ...e,
    status: computeElectionStatus(e),
  }));
  const votedUsers = safeGet<Record<string, string[]>>(KEYS.VOTED_USERS, {});

  let activeElections = 0;
  let upcomingElections = 0;
  let completedElections = 0;
  const statusDistribution: Record<string, number> = {};
  const votesPerElection: { name: string; votes: number }[] = [];
  let totalVotesCast = 0;

  for (const election of elections) {
    const status = election.status;
    statusDistribution[status] = (statusDistribution[status] || 0) + 1;

    if (status === 'active') activeElections++;
    else if (status === 'scheduled') upcomingElections++;
    else if (status === 'closed' || status === 'results_published') completedElections++;

    const electionVotes = votedUsers[election.id]?.length || 0;
    totalVotesCast += electionVotes;
    votesPerElection.push({
      name: election.title.length > 20 ? election.title.slice(0, 20) + '...' : election.title,
      votes: electionVotes,
    });
  }

  const voters = safeGet<Record<string, string[]>>(KEYS.VOTED_USERS, {});
  const allVoterIds = new Set<string>();
  for (const voterList of Object.values(voters)) {
    voterList.forEach((id) => allVoterIds.add(id));
  }

  return {
    stats: {
      totalVoters: allVoterIds.size || 3,
      verifiedVoters: allVoterIds.size || 3,
      activeElections,
      upcomingElections,
      completedElections,
      totalVotesCast,
      turnoutPercentage:
        (allVoterIds.size || 0) > 0
          ? Math.round((totalVotesCast / (allVoterIds.size || 1)) * 100)
          : 0,
    },
    recentElections: elections.slice(-5).reverse().map((e) => ({
      id: e.id,
      title: e.title,
      status: e.status,
      totalVotes: votedUsers[e.id]?.length || 0,
    })),
    recentAuditLogs: [],
    votesPerElection,
    statusDistribution,
  };
}

// ─── Reset ───────────────────────────────────────────────────

export function resetDemoData(): void {
  localStorage.removeItem(KEYS.ELECTIONS);
  localStorage.removeItem(KEYS.CANDIDATES);
  localStorage.removeItem(KEYS.VOTES);
  localStorage.removeItem(KEYS.VOTED_USERS);
  localStorage.removeItem(KEYS.INITIALIZED);
  seedDemoData();
}
