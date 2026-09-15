import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Vote,
  Users,
  Activity,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle,
  Settings,
  UserPlus,
  BarChart3,
  Server,
} from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import AdminLayout from '@/layouts/admin-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/api/client';

export default function SuperAdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiClient.get<{ success: boolean; data: any }>('/admin/dashboard');
        setDashboardData(res.data || null);
      } catch { setDashboardData(null); }
      finally { setIsLoading(false); }
    };
    fetchDashboard();
  }, []);

  const stats = useMemo(() => {
    if (!dashboardData) {
      return {
        totalAdmins: 0,
        totalElections: 0,
        activeElections: 0,
        totalVoters: 0,
        totalVotes: 0,
        systemHealth: 'Unknown' as const,
      };
    }
    return {
      totalAdmins: dashboardData.totalAdmins ?? 0,
      totalElections: dashboardData.totalElections ?? 0,
      activeElections: dashboardData.activeElections ?? 0,
      totalVoters: dashboardData.totalVoters ?? 0,
      totalVotes: dashboardData.totalVotes ?? 0,
      systemHealth: (dashboardData.systemHealth ?? 'Unknown') as 'Operational' | 'Degraded' | 'Down' | 'Unknown',
    };
  }, [dashboardData]);

  const recentActivity = useMemo(
    () => dashboardData?.recentActivity ?? [],
    [dashboardData]
  );

  const statCards = [
    {
      label: 'Total Admins',
      value: stats.totalAdmins,
      icon: Shield,
      color: 'text-primary-600',
      bg: 'bg-primary-100',
      href: '/admin/super-admins',
    },
    {
      label: 'Total Elections',
      value: stats.totalElections,
      icon: Vote,
      color: 'text-secondary-600',
      bg: 'bg-secondary-100',
      href: '/admin/elections',
    },
    {
      label: 'System Health',
      value: stats.systemHealth,
      icon: Activity,
      color: 'text-success-600',
      bg: 'bg-success-100',
      href: '/admin/system-settings',
    },
    {
      label: 'Active Users',
      value: stats.totalVoters,
      icon: Users,
      color: 'text-warning-600',
      bg: 'bg-warning-100',
      href: '/admin/voters',
    },
  ];

  const quickActions = [
    {
      label: 'Manage Admins',
      description: 'Add, edit, or remove administrators',
      icon: UserPlus,
      href: '/admin/super-admins',
      color: 'text-primary-600',
    },
    {
      label: 'System Settings',
      description: 'Configure security and maintenance',
      icon: Settings,
      href: '/admin/system-settings',
      color: 'text-gray-600',
    },
    {
      label: 'View Elections',
      description: 'Monitor all system elections',
      icon: BarChart3,
      href: '/admin/elections',
      color: 'text-secondary-600',
    },
    {
      label: 'Server Status',
      description: 'Check system infrastructure',
      icon: Server,
      href: '/admin/system-settings',
      color: 'text-success-600',
    },
  ];

  function getActionIcon(action: string) {
    if (action.includes('create')) return CheckCircle;
    if (action.includes('update') || action.includes('settings')) return Settings;
    if (action.includes('login')) return Users;
    if (action.includes('start') || action.includes('publish')) return TrendingUp;
    return Clock;
  }

  function getActionColor(action: string) {
    if (action.includes('create')) return 'text-success-600';
    if (action.includes('update') || action.includes('settings')) return 'text-primary-600';
    if (action.includes('login')) return 'text-info-600';
    if (action.includes('start') || action.includes('publish')) return 'text-warning-600';
    return 'text-gray-600';
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-gray-500">Loading dashboard...</p>
          </div>
        ) : (
        <>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            System Overview
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor and manage the entire voting platform
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.label} to={card.href}>
                <Card hover>
                  <div className="flex items-center gap-4">
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', card.bg)}>
                      <Icon className={cn('h-6 w-6', card.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {card.label}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {card.value}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Activity
                </h2>
                <Link
                  to="/admin/audit-logs"
                  className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="space-y-4">
                {recentActivity.map((log: any) => {
                  const Icon = getActionIcon(log.action);
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                    >
                      <div className={cn('mt-0.5', getActionColor(log.action))}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-medium">{log.userName}</span>
                          {' · '}
                          <span className="text-gray-500 dark:text-gray-400">
                            {log.details}
                          </span>
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant={log.userRole === 'super_admin' ? 'info' : 'default'}>
                            {log.userRole.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatDateTime(log.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Quick Actions
              </h2>
              <div className="space-y-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      to={action.href}
                      className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                    >
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800', action.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {action.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </Link>
                  );
                })}
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                System Status
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    API Status
                  </span>
                  <Badge variant="success">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Database
                  </span>
                  <Badge variant="success">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Active Elections
                  </span>
                  <Badge variant="info">{stats.activeElections}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Total Votes Cast
                  </span>
                  <Badge variant="default">{stats.totalVotes.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Maintenance Mode
                  </span>
                  <Badge variant="default">Off</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
        </>
        )}
      </div>
    </AdminLayout>
  );
}
