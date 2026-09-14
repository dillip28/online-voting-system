import type { ElectionStatus, CandidateStatus } from '@/types';
import { Badge, type BadgeVariant } from './badge';

type StatusType = ElectionStatus | CandidateStatus;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const electionStatusStyles: Record<ElectionStatus, BadgeVariant> = {
  draft: 'default',
  scheduled: 'info',
  active: 'success',
  closed: 'danger',
  results_published: 'info',
  archived: 'outline',
};

const candidateStatusStyles: Record<CandidateStatus, BadgeVariant> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  withdrawn: 'outline',
};

const electionLabels: Record<ElectionStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  active: 'Active',
  closed: 'Closed',
  results_published: 'Results Published',
  archived: 'Archived',
};

const candidateLabels: Record<CandidateStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

function isElectionStatus(status: StatusType): status is ElectionStatus {
  return status in electionStatusStyles;
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = isElectionStatus(status)
    ? electionStatusStyles[status]
    : candidateStatusStyles[status];

  const label = isElectionStatus(status)
    ? electionLabels[status]
    : candidateLabels[status];

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

export { StatusBadge, type StatusBadgeProps, type StatusType };
