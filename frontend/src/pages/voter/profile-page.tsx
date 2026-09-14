import { useState } from 'react';
import { User, Mail, Phone, CreditCard, Shield, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Card, Input, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from '@/layouts/dashboard-layout';

export default function ProfilePage() {
  const { user } = useAuthStore();
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
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
  };

  const handleChangePassword = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    setPasswords({ current: '', newPassword: '', confirm: '' });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Manage your account settings
          </p>
        </div>

        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700 dark:bg-primary-900/50 dark:text-primary-400">
              {user?.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {user?.fullName}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
              <Badge variant="info" className="mt-1">
                {user?.role}
              </Badge>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
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
            />
            <Input
              label="Email"
              icon={Mail}
              type="email"
              value={personalInfo.email}
              onChange={(e) =>
                setPersonalInfo({ ...personalInfo, email: e.target.value })
              }
            />
            <Input
              label="Phone"
              icon={Phone}
              value={personalInfo.phone}
              onChange={(e) =>
                setPersonalInfo({ ...personalInfo, phone: e.target.value })
              }
            />
            <Input
              label="Student ID"
              icon={CreditCard}
              value={personalInfo.studentId}
              disabled
              className="bg-gray-50 dark:bg-gray-800"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSavePersonal} isLoading={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
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
            />
            <Input
              label="New Password"
              icon={Shield}
              type="password"
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, newPassword: e.target.value })
              }
            />
            <Input
              label="Confirm New Password"
              icon={Shield}
              type="password"
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords({ ...passwords, confirm: e.target.value })
              }
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={handleChangePassword}
              disabled={!passwords.current || !passwords.newPassword || passwords.newPassword !== passwords.confirm}
            >
              Change Password
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add an extra layer of security to your account
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                twoFactorEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
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
