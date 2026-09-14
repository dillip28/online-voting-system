export type UserRole = 'voter' | 'admin' | 'super_admin';

export type ElectionStatus = 'draft' | 'scheduled' | 'active' | 'closed' | 'results_published' | 'archived';

export type ElectionType = 'presidential' | 'parliamentary' | 'local' | 'student' | 'organizational' | 'custom';

export type CandidateStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export type VoteStatus = 'pending' | 'submitted' | 'verified' | 'invalid';

export type NotificationType = 'election_start' | 'election_end' | 'vote_submitted' | 'results_published' | 'security_alert' | 'system' | 'reminder';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  studentId?: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  type: ElectionType;
  organization: string;
  status: ElectionStatus;
  startDate: string;
  endDate: string;
  createdBy: string;
  totalPositions: number;
  totalCandidates: number;
  eligibleVoters: number;
  votesCast: number;
  enableNota: boolean;
  maxSelections: number;
  publishedResults: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  electionId: string;
  title: string;
  description: string;
  maxSelections: number;
  order: number;
}

export interface Candidate {
  id: string;
  electionId: string;
  positionId: string;
  position?: Position;
  name: string;
  photo?: string;
  party?: string;
  biography: string;
  manifesto: string;
  status: CandidateStatus;
  votesReceived: number;
  createdAt: string;
}

export interface Vote {
  id: string;
  electionId: string;
  voterId: string;
  positionId: string;
  candidateId: string | null;
  isNota: boolean;
  submittedAt: string;
  confirmationId: string;
  status: VoteStatus;
}

export interface VoteSubmission {
  electionId: string;
  selections: {
    positionId: string;
    candidateId: string | null;
    isNota: boolean;
  }[];
}

export interface Result {
  electionId: string;
  positionId: string;
  position: string;
  candidates: {
    candidateId: string;
    name: string;
    photo?: string;
    party?: string;
    votes: number;
    percentage: number;
    rank: number;
    isWinner: boolean;
  }[];
  totalVotes: number;
  notaVotes: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  electionId?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  resource: string;
  resourceId: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface Admin {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  createdAt: string;
}

export interface SystemSettings {
  electionDefaults: {
    maxPositions: number;
    enableNota: boolean;
    defaultDuration: number;
    allowSelfNomination: boolean;
  };
  authentication: {
    requireEmailVerification: boolean;
    requirePhoneVerification: boolean;
    twoFactorRequired: boolean;
    passwordMinLength: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    electionReminders: boolean;
    resultNotifications: boolean;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    ipWhitelist: string[];
  };
}

export interface DashboardStats {
  totalElections: number;
  activeElections: number;
  upcomingElections: number;
  completedElections: number;
  totalVoters: number;
  totalVotes: number;
  participationRate: number;
}

export interface VoteHistory {
  id: string;
  election: {
    id: string;
    title: string;
    type: ElectionType;
    endDate: string;
  };
  confirmationId: string;
  status: VoteStatus;
  submittedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
