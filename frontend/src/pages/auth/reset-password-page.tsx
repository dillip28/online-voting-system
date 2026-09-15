import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Lock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import type { FormEvent } from 'react';

type PasswordStrength = 'weak' | 'fair' | 'strong';

function getPasswordStrength(password: string): { level: PasswordStrength; color: string; width: string } {
  if (!password) return { level: 'weak', color: 'bg-danger-500', width: '0%' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 'weak', color: 'bg-danger-500', width: '33%' };
  if (score <= 3) return { level: 'fair', color: 'bg-warning-500', width: '66%' };
  return { level: 'strong', color: 'bg-success-500', width: '100%' };
}

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const strengthLabel: Record<PasswordStrength, string> = {
    weak: 'Weak',
    fair: 'Fair',
    strong: 'Strong',
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(true);
      toast('success', 'Your password has been successfully reset.');
    } catch (err: any) {
      toast('error', err?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-50">
              <CheckCircle2 className="h-6 w-6 text-success-500" />
            </div>
            <div className="space-y-1">
              <h2 className="text-[20px] font-bold tracking-tight text-surface-900">
                Password reset successful
              </h2>
              <p className="text-sm text-surface-500">
                Your password has been updated. You can now sign in with your new password.
              </p>
            </div>
            <Link to="/login" className="w-full">
              <Button variant="primary" className="w-full">
                Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-[20px] font-bold tracking-tight text-surface-900">
          Reset password
        </CardTitle>
        <CardDescription className="text-sm text-surface-500">
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="password"
              label="New password"
              type="password"
              placeholder="Enter new password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            {password && (
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-100">
                  <div
                    className={cn('h-full rounded-full transition-all duration-300', strength.color)}
                    style={{ width: strength.width }}
                  />
                </div>
                <p className="text-xs text-surface-500">
                  Password strength:{' '}
                  <span className="font-medium text-surface-700">{strengthLabel[strength.level]}</span>
                </p>
              </div>
            )}
          </div>

          <Input
            id="confirmPassword"
            label="Confirm password"
            type="password"
            placeholder="Re-enter new password"
            icon={Lock}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
            isLoading={loading}
          >
            {loading ? 'Resetting password...' : 'Reset Password'}
          </Button>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-medium text-primary-500 hover:text-primary-600"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
