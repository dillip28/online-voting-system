import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-100 text-surface-600 border border-surface-200',
  success: 'bg-success-50 text-success-600 border border-success-500/20',
  warning: 'bg-warning-50 text-warning-600 border border-warning-500/20',
  danger: 'bg-danger-50 text-danger-500 border border-danger-500/20',
  info: 'bg-info-50 text-info-600 border border-info-500/20',
  outline: 'bg-transparent text-surface-600 border border-surface-200',
};

function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export { Badge, type BadgeProps, type BadgeVariant };
