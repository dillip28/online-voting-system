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
import { getDashboardStats } from '@/services/electionStorage';
import { getAuditLogs } from '@/services/auditStorage';

export default function SuperAdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const stats = getDashboardStats();
      const auditResult = getAuditLogs({ limit: 5 });
      setDashboardData({
        totalAdmins: 3,
        totalElections: (stats.stats.activeElections || 0) + (stats.stats.upcomingElections || 0) + (stats.stats.completedElections || 0),
        activeElections: stats.stats.activeElections,
        totalVoters: stats.stats.totalVoters,
        totalVotes: stats.stats.totalVotesCast,
        systemHealth: 'Operational',
        recentActivity: auditResult.items,
      });
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
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
      color: 'text-accent-600',
      bg: 'bg-accent-100',
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
      color: 'text-surface-600',
    },
    {
      label: 'View Elections',
      description: 'Monitor all system elections',
      icon: BarChart3,
      href: '/admin/elections',
      color: 'text-accent-600',
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
    return 'text-surface-600';
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-200 border-t-primary-600" />
            <span className="ml-3 text-sm text-surface-500">Loading dashboard...</span>
          </div>
        ) : (
        <>
        <div>
          <h1 className="text-[22px] font-semibold text-surface-900">
            System Overview
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Monitor and manage the entire voting platform
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.label} to={card.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', card.bg)}>
                      <Icon className={cn('h-6 w-6', card.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-500">
                        {card.label}
                      </p>
                      <p className="text-2xl font-bold text-surface-900">
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
                <h2 className="text-[16px] font-semibold text-surface-900">
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
                      className="flex items-start gap-3 rounded-lg border border-surface-100 p-3 transition-colors hover:bg-surface-50"
                    >
                      <div className={cn('mt-0.5', getActionColor(log.action))}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-surface-900">
                          <span className="font-medium">{log.userName}</span>
                          {' · '}
                          <span className="text-surface-500">
                            {log.details}
                          </span>
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant={log.userRole === 'super_admin' ? 'info' : 'default'}>
                            {log.userRole.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-surface-400">
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
              <h2 className="mb-4 text-[16px] font-semibold text-surface-900">
                Quick Actions
              </h2>
              <div className="space-y-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      to={action.href}
                      className="flex items-center gap-3 rounded-lg border border-surface-100 p-3 transition-colors hover:bg-surface-50"
                    >
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100', action.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900">
                          {action.label}
                        </p>
                        <p className="text-xs text-surface-500">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-surface-400" />
                    </Link>
                  );
                })}
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 text-[16px] font-semibold text-surface-900">
                System Status
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-600">
                    Local Storage
                  </span>
                  <Badge variant="success">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-600">
                    Active Elections
                  </span>
                  <Badge variant="info">{stats.activeElections}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-600">
                    Total Votes Cast
                  </span>
                  <Badge variant="default">{stats.totalVotes.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-600">
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
