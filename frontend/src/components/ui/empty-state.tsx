import type { ElementType } from 'react';
import { Button, type ButtonProps } from './button';

interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description?: string;
  action?: ButtonProps;
}

function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-gray-100 p-4">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          <Button {...action} />
        </div>
      )}
    </div>
  );
}

export { EmptyState, type EmptyStateProps };
