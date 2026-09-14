import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, checked, onChange, onCheckedChange, error, id, ...rest }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const handleChange = onChange || onCheckedChange;

    return (
      <div className="w-full">
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              ref={ref}
              id={checkboxId}
              type="checkbox"
              checked={checked}
              onChange={(e) => handleChange?.(e.target.checked)}
              className="peer sr-only"
              {...rest}
            />
            <label
              htmlFor={checkboxId}
              className={cn(
                'flex h-5 w-5 cursor-pointer items-center justify-center rounded border transition-colors',
                'border-gray-300 bg-white',
                'peer-checked:border-primary-600 peer-checked:bg-primary-600',
                'peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2',
                'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                error && 'border-danger-500',
                className
              )}
            >
              {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
            </label>
          </div>
          {label && (
            <label
              htmlFor={checkboxId}
              className="cursor-pointer text-sm text-gray-700 dark:text-gray-300"
            >
              {label}
            </label>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox, type CheckboxProps };
