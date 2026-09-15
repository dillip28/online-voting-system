import type { ElementType, ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description?: string;
  action?: {
    children: ReactNode;
    onClick: () => void;
  };
}

function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-100">
          <Icon className="h-6 w-6 text-surface-400" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-surface-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-surface-500">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          {action.children}
        </button>
      )}
    </div>
  );
}

export { EmptyState, type EmptyStateProps };
