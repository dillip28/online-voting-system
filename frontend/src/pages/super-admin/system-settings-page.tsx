import { useState, type FormEvent } from 'react';
import {
  Settings,
  Shield,
  Wrench,
  Save,
  AlertTriangle,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminLayout from '@/layouts/admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { adminApi } from '@/api/admin';

interface GeneralSettings {
  systemName: string;
  supportEmail: string;
  defaultTimezone: string;
}

interface SecuritySettings {
  passwordMinLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  require2FA: boolean;
}

interface MaintenanceSettings {
  maintenanceMode: boolean;
  systemMessage: string;
}

export default function SystemSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');

  const [general, setGeneral] = useState<GeneralSettings>({
    systemName: 'VoteSecure',
    supportEmail: 'support@votesecure.com',
    defaultTimezone: 'UTC',
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    require2FA: false,
  });

  const [maintenance, setMaintenance] = useState<MaintenanceSettings>({
    maintenanceMode: false,
    systemMessage:
      'The system is currently undergoing scheduled maintenance. Please check back later.',
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateSystemSettings({
        electionDefaults: {
          maxPositions: 10,
          enableNota: true,
          defaultDuration: 8,
          allowSelfNomination: false,
        },
        authentication: {
          requireEmailVerification: true,
          requirePhoneVerification: false,
          twoFactorRequired: security.require2FA,
          passwordMinLength: security.passwordMinLength,
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          electionReminders: true,
          resultNotifications: true,
        },
        security: {
          sessionTimeout: security.sessionTimeout,
          maxLoginAttempts: security.maxLoginAttempts,
          lockoutDuration: security.lockoutDuration,
          ipWhitelist: [],
        },
      });
      toast('success', 'Settings saved successfully');
    } catch {
      toast('error', 'Failed to save settings. The backend may not be running.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-semibold text-primary-700">
            System Settings
          </h1>
          <p className="mt-1 text-[14px] text-surface-500">
            Configure platform-wide settings and policies
          </p>
        </div>

        <Card className="!p-0">
          <div className="px-6 pt-4">
            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          <form onSubmit={handleSave} className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-[16px] font-semibold text-surface-800">
                    General Settings
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Input
                      label="System Name"
                      value={general.systemName}
                      onChange={(e) =>
                        setGeneral((prev) => ({
                          ...prev,
                          systemName: e.target.value,
                        }))
                      }
                    />
                    <Input
                      label="Support Email"
                      type="email"
                      value={general.supportEmail}
                      onChange={(e) =>
                        setGeneral((prev) => ({
                          ...prev,
                          supportEmail: e.target.value,
                        }))
                      }
                    />
                    <Select
                      label="Default Timezone"
                      options={[
                        { value: 'UTC', label: 'UTC' },
                        { value: 'America/New_York', label: 'Eastern Time (ET)' },
                        { value: 'America/Chicago', label: 'Central Time (CT)' },
                        { value: 'America/Denver', label: 'Mountain Time (MT)' },
                        { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
                        { value: 'Europe/London', label: 'London (GMT)' },
                        { value: 'Europe/Paris', label: 'Paris (CET)' },
                        { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
                      ]}
                      value={general.defaultTimezone}
                      onChange={(e) =>
                        setGeneral((prev) => ({
                          ...prev,
                          defaultTimezone: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8">
                <div>
                  <h3 className="mb-4 text-[16px] font-semibold text-surface-800">
                    Password Policy
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Input
                      label="Minimum Password Length"
                      type="number"
                      min={6}
                      max={128}
                      value={security.passwordMinLength}
                      onChange={(e) =>
                        setSecurity((prev) => ({
                          ...prev,
                          passwordMinLength: parseInt(e.target.value) || 8,
                        }))
                      }
                    />
                    <div className="space-y-3">
                      <p className="text-[14px] font-medium text-surface-700">
                        Password Requirements
                      </p>
                      <Checkbox
                        label="Require uppercase letters"
                        checked={security.requireUppercase}
                        onChange={(checked) =>
                          setSecurity((prev) => ({
                            ...prev,
                            requireUppercase: checked,
                          }))
                        }
                      />
                      <Checkbox
                        label="Require numbers"
                        checked={security.requireNumbers}
                        onChange={(checked) =>
                          setSecurity((prev) => ({
                            ...prev,
                            requireNumbers: checked,
                          }))
                        }
                      />
                      <Checkbox
                        label="Require special characters"
                        checked={security.requireSpecialChars}
                        onChange={(checked) =>
                          setSecurity((prev) => ({
                            ...prev,
                            requireSpecialChars: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-surface-100 pt-6">
                  <h3 className="mb-4 text-[16px] font-semibold text-surface-800">
                    Session Settings
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <Input
                      label="Session Timeout (minutes)"
                      type="number"
                      min={5}
                      max={1440}
                      value={security.sessionTimeout}
                      onChange={(e) =>
                        setSecurity((prev) => ({
                          ...prev,
                          sessionTimeout: parseInt(e.target.value) || 60,
                        }))
                      }
                    />
                    <Input
                      label="Max Login Attempts"
                      type="number"
                      min={1}
                      max={20}
                      value={security.maxLoginAttempts}
                      onChange={(e) =>
                        setSecurity((prev) => ({
                          ...prev,
                          maxLoginAttempts: parseInt(e.target.value) || 5,
                        }))
                      }
                    />
                    <Input
                      label="Lockout Duration (minutes)"
                      type="number"
                      min={5}
                      max={1440}
                      value={security.lockoutDuration}
                      onChange={(e) =>
                        setSecurity((prev) => ({
                          ...prev,
                          lockoutDuration: parseInt(e.target.value) || 30,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="border-t border-surface-100 pt-6">
                  <h3 className="mb-4 text-[16px] font-semibold text-surface-800">
                    Two-Factor Authentication
                  </h3>
                  <div className="flex items-center justify-between rounded-lg border border-surface-200 p-4">
                    <div>
                      <p className="text-[14px] font-medium text-surface-800">
                        Require 2FA for all admins
                      </p>
                      <p className="text-[14px] text-surface-500">
                        Enforce two-factor authentication for all administrator
                        accounts
                      </p>
                    </div>
                    <Checkbox
                      checked={security.require2FA}
                      onChange={(checked) =>
                        setSecurity((prev) => ({ ...prev, require2FA: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-[16px] font-semibold text-surface-800">
                    Maintenance Mode
                  </h3>
                  <div className="flex items-center justify-between rounded-lg border border-surface-200 p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          maintenance.maintenanceMode
                            ? 'bg-warning-50 text-warning-600 border border-warning-500/20'
                            : 'bg-surface-100 text-surface-500 border border-surface-200'
                        )}
                      >
                        {maintenance.maintenanceMode ? (
                          <AlertTriangle className="h-5 w-5" />
                        ) : (
                          <Server className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-surface-800">
                          Enable Maintenance Mode
                        </p>
                        <p className="text-[14px] text-surface-500">
                          Temporarily disable public access to the platform
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      checked={maintenance.maintenanceMode}
                      onChange={(checked) =>
                        setMaintenance((prev) => ({
                          ...prev,
                          maintenanceMode: checked,
                        }))
                      }
                    />
                  </div>
                </div>

                {maintenance.maintenanceMode && (
                  <div className="rounded-lg border border-warning-500/20 bg-warning-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-600" />
                      <div>
                        <p className="text-[14px] font-medium text-warning-700">
                          Maintenance mode is active
                        </p>
                        <p className="mt-1 text-[14px] text-warning-600">
                          All public-facing pages will display the maintenance
                          message. Admins can still access the dashboard.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-[14px] font-medium text-surface-700">
                    Maintenance Message
                  </label>
                  <textarea
                    rows={4}
                    value={maintenance.systemMessage}
                    onChange={(e) =>
                      setMaintenance((prev) => ({
                        ...prev,
                        systemMessage: e.target.value,
                      }))
                    }
                    className={cn(
                      'block w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-[14px] text-surface-800',
                      'placeholder:text-surface-400',
                      'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
                      'disabled:cursor-not-allowed disabled:bg-surface-50 disabled:text-surface-400'
                    )}
                    placeholder="Enter a message to display during maintenance..."
                  />
                  <p className="mt-1 text-xs text-surface-400">
                    This message will be shown to users when maintenance mode is
                    enabled.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-end border-t border-surface-100 pt-6">
              <Button type="submit" isLoading={saving}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
}
