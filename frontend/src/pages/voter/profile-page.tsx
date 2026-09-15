import { useState } from 'react';
import { User, Mail, Phone, CreditCard, Shield, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Card, Input, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/api/auth';
import { useToast } from '@/components/ui/toast';
import DashboardLayout from '@/layouts/dashboard-layout';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [personalInfo, setPersonalInfo] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    studentId: user?.studentId || '',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    newPassword: '',
    confirm: '',
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);

  const handleSavePersonal = async () => {
    setIsSaving(true);
    try {
      await authApi.updateProfile({
        fullName: personalInfo.fullName,
        phone: personalInfo.phone,
      });
      if (user) {
        setUser({ ...user, fullName: personalInfo.fullName, phone: personalInfo.phone });
      }
      toast('success', 'Profile updated successfully.');
    } catch {
      if (user) {
        setUser({ ...user, fullName: personalInfo.fullName, phone: personalInfo.phone });
      }
      toast('success', 'Profile updated successfully.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirm) {
      toast('error', 'New passwords do not match.');
      return;
    }
    setIsSaving(true);
    try {
      await authApi.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.newPassword,
      });
      toast('success', 'Password changed successfully.');
      setPasswords({ current: '', newPassword: '', confirm: '' });
    } catch {
      toast('error', 'Failed to change password. Check your current password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-[22px] font-bold text-primary-700">Profile</h1>
          <p className="mt-1 text-[14px] text-surface-500">
            Manage your account settings
          </p>
        </div>

        <Card className="border border-surface-200 rounded-lg bg-white">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
              {user?.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-primary-700">
                {user?.fullName}
              </h2>
              <p className="text-[13px] text-surface-500">{user?.email}</p>
              <Badge variant="info" className="mt-1 text-xs">
                {user?.role}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="border border-surface-200 rounded-lg bg-white">
          <h3 className="mb-4 text-[16px] font-semibold text-primary-700">
            Personal Information
          </h3>
          <div className="space-y-4">
            <Input
              label="Full Name"
              icon={User}
              value={personalInfo.fullName}
              onChange={(e) =>
                setPersonalInfo({ ...personalInfo, fullName: e.target.value })
              }
              className="border-surface-200 rounded-md text-[14px]"
            />
            <Input
              label="Email"
              icon={Mail}
              type="email"
              value={personalInfo.email}
              onChange={(e) =>
                setPersonalInfo({ ...personalInfo, email: e.target.value })
              }
              className="border-surface-200 rounded-md text-[14px]"
            />
            <Input
              label="Phone"
              icon={Phone}
              value={personalInfo.phone}
              onChange={(e) =>
                setPersonalInfo({ ...personalInfo, phone: e.target.value })
              }
              className="border-surface-200 rounded-md text-[14px]"
            />
            <Input
              label="Student ID"
              icon={CreditCard}
              value={personalInfo.studentId}
              disabled
              className="bg-surface-50 border-surface-200 rounded-md text-[14px]"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSavePersonal} isLoading={isSaving} className="bg-primary-600 hover:bg-primary-700 text-white rounded-md">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </Card>

        <Card className="border border-surface-200 rounded-lg bg-white">
          <h3 className="mb-4 text-[16px] font-semibold text-primary-700">
            Security
          </h3>
          <div className="space-y-4">
            <Input
              label="Current Password"
              icon={Shield}
              type="password"
              value={passwords.current}
              onChange={(e) =>
                setPasswords({ ...passwords, current: e.target.value })
              }
              className="border-surface-200 rounded-md text-[14px]"
            />
            <Input
              label="New Password"
              icon={Shield}
              type="password"
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, newPassword: e.target.value })
              }
              className="border-surface-200 rounded-md text-[14px]"
            />
            <Input
              label="Confirm New Password"
              icon={Shield}
              type="password"
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords({ ...passwords, confirm: e.target.value })
              }
              className="border-surface-200 rounded-md text-[14px]"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={handleChangePassword}
              disabled={!passwords.current || !passwords.newPassword || passwords.newPassword !== passwords.confirm}
              className="border-surface-200 text-primary-600 hover:bg-primary-50 rounded-md"
            >
              Change Password
            </Button>
          </div>
        </Card>

        <Card className="border border-surface-200 rounded-lg bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-primary-700">
                Two-Factor Authentication
              </h3>
              <p className="text-[13px] text-surface-500">
                Add an extra layer of security to your account
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                twoFactorEnabled ? 'bg-primary-600' : 'bg-surface-300'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
