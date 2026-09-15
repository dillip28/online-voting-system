import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, IdCard, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
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

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!studentId.trim()) newErrors.studentId = 'Student ID is required';
    if (!department.trim()) newErrors.department = 'Department is required';
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!agreed) {
      newErrors.agreed = 'You must agree to the Terms of Service';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const success = await register({
        fullName,
        email,
        password,
        phone,
        studentId,
        department,
      });
      if (!success) {
        throw new Error('Registration failed. Please check your details and try again.');
      }
      toast('success', 'Your account has been created. Please sign in.');
      navigate('/login');
    } catch (err: any) {
      toast('error', err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strengthLabel: Record<PasswordStrength, string> = {
    weak: 'Weak',
    fair: 'Fair',
    strong: 'Strong',
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-[20px] font-bold tracking-tight text-surface-900">
          Create an account
        </CardTitle>
        <CardDescription className="text-sm text-surface-500">
          Enter your details to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="fullName"
            label="Full Name"
            placeholder="John Doe"
            icon={User}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={errors.fullName}
          />

          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="phone"
              label="Phone (optional)"
              placeholder="+1 234 567"
              icon={Phone}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              id="studentId"
              label="ID Number"
              placeholder="STU-001"
              icon={IdCard}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              error={errors.studentId}
            />
          </div>

          <Input
            id="department"
            label="Department"
            placeholder="e.g., Computer Science"
            icon={User}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            error={errors.department}
          />

          <div className="space-y-2">
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Create a password"
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
            label="Confirm Password"
            type="password"
            placeholder="Re-enter your password"
            icon={Lock}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
          />

          <div className="space-y-2">
            <Checkbox
              id="terms"
              label="I agree to the Terms of Service and Privacy Policy"
              checked={agreed}
              onCheckedChange={(val) => setAgreed(val === true)}
              error={errors.agreed}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
            isLoading={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>

          <p className="text-center text-sm text-surface-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-500 hover:text-primary-600">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
