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
        <div className="flex items-center gap-2.5">
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
                'flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded border transition-colors',
                'border-surface-300 bg-white',
                'peer-checked:border-primary-500 peer-checked:bg-primary-500',
                'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500/20',
                error && 'border-danger-500',
                className
              )}
            >
              {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </label>
          </div>
          {label && (
            <label
              htmlFor={checkboxId}
              className="cursor-pointer text-sm text-surface-600"
            >
              {label}
            </label>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox, type CheckboxProps };
