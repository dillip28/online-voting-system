import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Vote,
  Users,
  Calendar,
  BarChart3,
  Clock,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { mockElections } from '@/mocks/elections';
import { mockUsers } from '@/mocks/users';
import { mockAuditLogs } from '@/mocks/audit-logs';
import AdminLayout from '@/layouts/admin-layout';

const CHART_COLORS = {
  primary: '#123B5D',
  accent: '#167D72',
  surface: '#94A3B8',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#2563EB',
  success: '#16A34A',
};

const STATUS_COLORS: Record<string, string> = {
  draft: '#94A3B8',
  scheduled: '#2563EB',
  active: '#16A34A',
  closed: '#DC2626',
  results_published: '#167D72',
  archived: '#667085',
};

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const elections = mockElections;
  const voters = mockUsers.filter((u) => u.role === 'voter');

  const totalVotes = elections.reduce((sum, e) => sum + e.votesCast, 0);
  const totalEligible = elections.reduce((sum, e) => sum + e.eligibleVoters, 0);
  const participationRate = totalEligible > 0 ? Math.round((totalVotes / totalEligible) * 100) : 0;

  const stats = [
    {
      label: 'Total Elections',
      value: elections.length,
      icon: Vote,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
    },
    {
      label: 'Active Elections',
      value: elections.filter((e) => e.status === 'active').length,
      icon: Calendar,
      color: 'text-success-600',
      bg: 'bg-success-50',
    },
    {
      label: 'Upcoming',
      value: elections.filter((e) => e.status === 'scheduled').length,
      icon: Clock,
      color: 'text-info-600',
      bg: 'bg-info-50',
    },
    {
      label: 'Completed',
      value: elections.filter((e) => ['closed', 'results_published'].includes(e.status)).length,
      icon: CheckCircle2,
      color: 'text-accent-600',
      bg: 'bg-accent-50',
    },
    {
      label: 'Total Voters',
      value: voters.length,
      icon: Users,
      color: 'text-warning-600',
      bg: 'bg-warning-50',
    },
    {
      label: 'Total Votes',
      value: totalVotes.toLocaleString(),
      icon: BarChart3,
      color: 'text-danger-600',
      bg: 'bg-danger-50',
    },
  ];

  const votesPerElection = elections
    .filter((e) => e.votesCast > 0)
    .map((e) => ({
      name: e.title.length > 18 ? e.title.slice(0, 18) + '…' : e.title,
      votes: e.votesCast,
    }));

  const statusDistribution = [
    { name: 'Draft', value: elections.filter((e) => e.status === 'draft').length },
    { name: 'Scheduled', value: elections.filter((e) => e.status === 'scheduled').length },
    { name: 'Active', value: elections.filter((e) => e.status === 'active').length },
    { name: 'Closed', value: elections.filter((e) => e.status === 'closed').length },
    { name: 'Published', value: elections.filter((e) => e.status === 'results_published').length },
  ].filter((d) => d.value > 0);

  const participationOverTime = [
    { month: 'Apr', voters: 1200, votes: 890 },
    { month: 'May', voters: 1350, votes: 1020 },
    { month: 'Jun', voters: 1100, votes: 780 },
    { month: 'Jul', voters: 1450, votes: 1150 },
    { month: 'Aug', voters: 1600, votes: 1380 },
    { month: 'Sep', voters: 1800, votes: 1560 },
  ];

  const recentActivity = mockAuditLogs.slice(0, 5);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-semibold text-surface-900">Dashboard</h1>
          <p className="mt-1 text-sm text-surface-500">
            Overview of your voting system statistics and activity.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <div className="flex items-center gap-3">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', stat.bg)}>
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-surface-500">{stat.label}</p>
                  <p className="text-xl font-semibold text-surface-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-surface-900">Participation Rate</h3>
            <span className="text-xl font-semibold text-primary-600">{participationRate}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-100">
            <div
              className="h-full rounded-full bg-primary-500 transition-all"
              style={{ width: `${participationRate}%` }}
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="mb-4 text-[15px] font-semibold text-surface-900">Votes Per Election</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={votesPerElection} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F4" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={140}
                    tick={{ fontSize: 12, fill: '#667085' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '6px',
                      border: '1px solid #D9E0E7',
                      fontSize: '13px',
                      boxShadow: 'none',
                    }}
                  />
                  <Bar dataKey="votes" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-[15px] font-semibold text-surface-900">Election Status Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusDistribution.map((entry) => {
                      const statusKey = entry.name.toLowerCase() === 'published'
                        ? 'results_published'
                        : entry.name.toLowerCase();
                      return (
                        <Cell
                          key={entry.name}
                          fill={STATUS_COLORS[statusKey] || '#94A3B8'}
                          stroke="none"
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '6px',
                      border: '1px solid #D9E0E7',
                      fontSize: '13px',
                      boxShadow: 'none',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', color: '#667085' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card>
          <h3 className="mb-4 text-[15px] font-semibold text-surface-900">Voter Participation Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={participationOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F4" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#667085' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '6px',
                    border: '1px solid #D9E0E7',
                    fontSize: '13px',
                    boxShadow: 'none',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#667085' }} />
                <Line
                  type="monotone"
                  dataKey="voters"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART_COLORS.primary }}
                  activeDot={{ r: 5 }}
                  name="Eligible Voters"
                />
                <Line
                  type="monotone"
                  dataKey="votes"
                  stroke={CHART_COLORS.accent}
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART_COLORS.accent }}
                  activeDot={{ r: 5 }}
                  name="Votes Cast"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-[15px] font-semibold text-surface-900">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-lg border border-surface-100 p-3.5 transition-colors hover:bg-surface-50"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50">
                  <Activity className="h-4 w-4 text-primary-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-surface-900">{log.userName}</span>
                    <span className="text-sm text-surface-500">{log.action}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-surface-600">{log.details}</p>
                  <p className="mt-1 text-xs text-surface-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status="draft" className="shrink-0" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
