import { cn } from '@/lib/utils';
import type { ElectionStatus, CandidateStatus } from '@/types';

type StatusType = ElectionStatus | CandidateStatus;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-surface-100 text-surface-500 border border-surface-200' },
  scheduled: { label: 'Scheduled', className: 'bg-info-50 text-info-600 border border-info-500/20' },
  active: { label: 'Active', className: 'bg-success-50 text-success-600 border border-success-500/20' },
  closed: { label: 'Closed', className: 'bg-surface-100 text-surface-600 border border-surface-200' },
  results_published: { label: 'Published', className: 'bg-accent-50 text-accent-600 border border-accent-500/20' },
  archived: { label: 'Archived', className: 'bg-surface-100 text-surface-500 border border-surface-200' },
  pending: { label: 'Pending', className: 'bg-warning-50 text-warning-600 border border-warning-500/20' },
  approved: { label: 'Approved', className: 'bg-success-50 text-success-600 border border-success-500/20' },
  rejected: { label: 'Rejected', className: 'bg-danger-50 text-danger-500 border border-danger-500/20' },
  withdrawn: { label: 'Withdrawn', className: 'bg-surface-100 text-surface-500 border border-surface-200' },
};

function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export { StatusBadge, type StatusBadgeProps, type StatusType };
