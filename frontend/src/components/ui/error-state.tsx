import type { ElementType, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  icon?: ElementType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  children?: ReactNode;
}

function ErrorState({ icon: Icon, title = 'Something went wrong', message, onRetry, className, children }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-danger-50">
        {Icon ? <Icon className="h-6 w-6 text-danger-500" /> : <AlertTriangle className="h-6 w-6 text-danger-500" />}
      </div>
      <h3 className="text-sm font-semibold text-surface-900">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-surface-500">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </button>
      )}
      {children}
    </div>
  );
}

export { ErrorState, type ErrorStateProps };
