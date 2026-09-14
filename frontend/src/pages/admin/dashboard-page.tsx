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

const STATUS_COLORS: Record<string, string> = {
  draft: '#94a3b8',
  scheduled: '#3b82f6',
  active: '#22c55e',
  closed: '#ef4444',
  results_published: '#8b5cf6',
  archived: '#6b7280',
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
      bg: 'bg-primary-100',
    },
    {
      label: 'Active Elections',
      value: elections.filter((e) => e.status === 'active').length,
      icon: Calendar,
      color: 'text-success-600',
      bg: 'bg-success-100',
    },
    {
      label: 'Upcoming Elections',
      value: elections.filter((e) => e.status === 'scheduled').length,
      icon: Clock,
      color: 'text-info-600',
      bg: 'bg-info-100',
    },
    {
      label: 'Completed Elections',
      value: elections.filter((e) => ['closed', 'results_published'].includes(e.status)).length,
      icon: CheckCircle2,
      color: 'text-secondary-600',
      bg: 'bg-secondary-100',
    },
    {
      label: 'Total Voters',
      value: voters.length,
      icon: Users,
      color: 'text-warning-600',
      bg: 'bg-warning-100',
    },
    {
      label: 'Total Votes',
      value: totalVotes.toLocaleString(),
      icon: BarChart3,
      color: 'text-danger-600',
      bg: 'bg-danger-100',
    },
  ];

  const votesPerElection = elections
    .filter((e) => e.votesCast > 0)
    .map((e) => ({
      name: e.title.length > 20 ? e.title.slice(0, 20) + '...' : e.title,
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your voting system statistics and activity.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <div className="flex items-center gap-4">
                <div className={cn('rounded-lg p-3', stat.bg)}>
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Participation Rate</h3>
            <span className="text-2xl font-bold text-primary-600">{participationRate}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-primary-600 transition-all"
              style={{ width: `${participationRate}%` }}
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Votes Per Election</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={votesPerElection} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar dataKey="votes" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Election Status Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
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
                          fill={STATUS_COLORS[statusKey] || '#94a3b8'}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Voter Participation Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={participationOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="voters"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Eligible Voters"
                />
                <Line
                  type="monotone"
                  dataKey="votes"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Votes Cast"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="mt-0.5 rounded-full bg-primary-100 p-2">
                  <Activity className="h-4 w-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{log.userName}</span>
                    <span className="text-sm text-gray-500">{log.action}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-gray-600">{log.details}</p>
                  <p className="mt-1 text-xs text-gray-400">
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
