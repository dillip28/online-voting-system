import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { authApi } from '@/api/auth';
import { useToast } from '@/components/ui/toast';
import type { FormEvent } from 'react';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validate = (): boolean => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email format');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
              <CheckCircle2 className="h-6 w-6 text-primary-500" />
            </div>
            <div className="space-y-1">
              <h2 className="text-[20px] font-bold tracking-tight text-surface-900">
                Check your email
              </h2>
              <p className="text-sm text-surface-500">
                We&apos;ve sent a password reset link to{' '}
                <span className="font-medium text-surface-700">{email}</span>
              </p>
            </div>
            <p className="text-xs text-surface-400">
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                }}
                className="font-medium text-primary-500 hover:text-primary-600"
              >
                try a different email
              </button>
            </p>
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-medium text-primary-500 hover:text-primary-600"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to sign in
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
          Forgot password?
        </CardTitle>
        <CardDescription className="text-sm text-surface-500">
          Enter your email and we&apos;ll send you a reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            error={error}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
            isLoading={loading}
          >
            {loading ? 'Sending reset link...' : 'Send Reset Link'}
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
