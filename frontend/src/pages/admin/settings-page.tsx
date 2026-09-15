import { useState } from 'react';
import { Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/components/ui/toast';
import type { SystemSettings } from '@/types';
import AdminLayout from '@/layouts/admin-layout';

const defaultSettings: SystemSettings = {
  electionDefaults: {
    maxPositions: 10,
    enableNota: true,
    defaultDuration: 7,
    allowSelfNomination: false,
  },
  authentication: {
    requireEmailVerification: true,
    requirePhoneVerification: false,
    twoFactorRequired: false,
    passwordMinLength: 8,
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    electionReminders: true,
    resultNotifications: true,
  },
  security: {
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    ipWhitelist: [],
  },
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('election');
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [ipWhitelistText, setIpWhitelistText] = useState(
    defaultSettings.security.ipWhitelist.join('\n')
  );

  const tabs = [
    { id: 'election', label: 'Election Defaults' },
    { id: 'auth', label: 'Authentication' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setShowConfirm(false);
    toast('success', 'System settings have been updated successfully.');
  };

  const updateElection = <K extends keyof SystemSettings['electionDefaults']>(
    key: K,
    value: SystemSettings['electionDefaults'][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      electionDefaults: { ...prev.electionDefaults, [key]: value },
    }));
  };

  const updateAuth = <K extends keyof SystemSettings['authentication']>(
    key: K,
    value: SystemSettings['authentication'][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      authentication: { ...prev.authentication, [key]: value },
    }));
  };

  const updateNotifications = <K extends keyof SystemSettings['notifications']>(
    key: K,
    value: SystemSettings['notifications'][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const updateSecurity = <K extends keyof SystemSettings['security']>(
    key: K,
    value: SystemSettings['security'][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, [key]: value },
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-semibold text-primary-700">Settings</h1>
          <p className="mt-1 text-[14px] text-surface-500">
            Configure system-wide settings and defaults.
          </p>
        </div>

        <Card className="!p-0">
          <div className="px-6 pt-4">
            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          <div className="p-6">
            {activeTab === 'election' && (
              <div className="space-y-6">
                <h2 className="text-[16px] font-semibold text-surface-800">Election Defaults</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <Input
                    label="Max Positions per Election"
                    type="number"
                    min={1}
                    max={50}
                    value={settings.electionDefaults.maxPositions}
                    onChange={(e) =>
                      updateElection('maxPositions', parseInt(e.target.value) || 1)
                    }
                  />
                  <Input
                    label="Default Duration (days)"
                    type="number"
                    min={1}
                    max={365}
                    value={settings.electionDefaults.defaultDuration}
                    onChange={(e) =>
                      updateElection('defaultDuration', parseInt(e.target.value) || 1)
                    }
                  />
                </div>
                <div className="space-y-3">
                  <Checkbox
                    label="Enable NOTA (None of the Above) by default"
                    checked={settings.electionDefaults.enableNota}
                    onChange={(checked) => updateElection('enableNota', checked)}
                  />
                  <Checkbox
                    label="Allow self-nomination for candidates"
                    checked={settings.electionDefaults.allowSelfNomination}
                    onChange={(checked) => updateElection('allowSelfNomination', checked)}
                  />
                </div>
              </div>
            )}

            {activeTab === 'auth' && (
              <div className="space-y-6">
                <h2 className="text-[16px] font-semibold text-surface-800">Authentication</h2>
                <div className="space-y-3">
                  <Checkbox
                    label="Require email verification for new accounts"
                    checked={settings.authentication.requireEmailVerification}
                    onChange={(checked) => updateAuth('requireEmailVerification', checked)}
                  />
                  <Checkbox
                    label="Require phone verification"
                    checked={settings.authentication.requirePhoneVerification}
                    onChange={(checked) => updateAuth('requirePhoneVerification', checked)}
                  />
                  <Checkbox
                    label="Require two-factor authentication for all users"
                    checked={settings.authentication.twoFactorRequired}
                    onChange={(checked) => updateAuth('twoFactorRequired', checked)}
                  />
                </div>
                <Input
                  label="Minimum Password Length"
                  type="number"
                  min={6}
                  max={128}
                  value={settings.authentication.passwordMinLength}
                  onChange={(e) =>
                    updateAuth('passwordMinLength', parseInt(e.target.value) || 8)
                  }
                />
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-[16px] font-semibold text-surface-800">Notifications</h2>
                <div className="space-y-3">
                  <Checkbox
                    label="Enable email notifications"
                    checked={settings.notifications.emailNotifications}
                    onChange={(checked) => updateNotifications('emailNotifications', checked)}
                  />
                  <Checkbox
                    label="Enable SMS notifications"
                    checked={settings.notifications.smsNotifications}
                    onChange={(checked) => updateNotifications('smsNotifications', checked)}
                  />
                  <Checkbox
                    label="Send election reminders to voters"
                    checked={settings.notifications.electionReminders}
                    onChange={(checked) => updateNotifications('electionReminders', checked)}
                  />
                  <Checkbox
                    label="Send result notifications when published"
                    checked={settings.notifications.resultNotifications}
                    onChange={(checked) => updateNotifications('resultNotifications', checked)}
                  />
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-[16px] font-semibold text-surface-800">Security</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <Input
                    label="Session Timeout (minutes)"
                    type="number"
                    min={5}
                    max={480}
                    value={settings.security.sessionTimeout}
                    onChange={(e) =>
                      updateSecurity('sessionTimeout', parseInt(e.target.value) || 30)
                    }
                  />
                  <Input
                    label="Max Login Attempts"
                    type="number"
                    min={1}
                    max={20}
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) =>
                      updateSecurity('maxLoginAttempts', parseInt(e.target.value) || 5)
                    }
                  />
                  <Input
                    label="Lockout Duration (minutes)"
                    type="number"
                    min={1}
                    max={1440}
                    value={settings.security.lockoutDuration}
                    onChange={(e) =>
                      updateSecurity('lockoutDuration', parseInt(e.target.value) || 15)
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[14px] font-medium text-surface-700">
                    IP Whitelist (one per line)
                  </label>
                  <textarea
                    className={cn(
                      'block w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-[14px] text-surface-800',
                      'placeholder:text-surface-400',
                      'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
                      'min-h-[100px] resize-y font-mono'
                    )}
                    placeholder="192.168.1.0/24&#10;10.0.0.1"
                    value={ipWhitelistText}
                    onChange={(e) => {
                      setIpWhitelistText(e.target.value);
                      updateSecurity(
                        'ipWhitelist',
                        e.target.value
                          .split('\n')
                          .map((l) => l.trim())
                          .filter(Boolean)
                      );
                    }}
                  />
                  <p className="mt-1 text-xs text-surface-400">
                    Leave empty to allow all IPs. Add one IP or CIDR range per line.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => setShowConfirm(true)} isLoading={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        title="Save Settings"
        message="Are you sure you want to save these system settings? This will affect all users."
        confirmLabel="Save Settings"
        confirmVariant="primary"
      />
    </AdminLayout>
  );
}
