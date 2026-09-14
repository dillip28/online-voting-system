import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Vote,
  Calendar,
  CheckCircle,
  BarChart3,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import { StatusBadge } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Skeleton, SkeletonCard } from '@/components/ui';
import { useAuthStore } from '@/store/auth-store';
import { useElectionStore } from '@/store/election-store';
import type { Election, ElectionType } from '@/types';
import DashboardLayout from '@/layouts/dashboard-layout';

const typeBadgeVariant: Record<ElectionType, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  presidential: 'danger',
  parliamentary: 'info',
  local: 'default',
  student: 'success',
  organizational: 'warning',
  custom: 'default',
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <Card hover>
      <div className="flex items-center gap-4">
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', color)}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function ElectionCard({ election }: { election: Election }) {
  return (
    <Card hover className="flex flex-col justify-between">
      <div>
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {election.title}
          </h3>
          <Badge variant={typeBadgeVariant[election.type]}>
            {election.type}
          </Badge>
        </div>
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          {election.organization}
        </p>
        <div className="mb-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(election.startDate)} - {formatDate(election.endDate)}
          </span>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <StatusBadge status={election.status} />
          <span className="text-sm text-gray-500">
            {formatNumber(election.votesCast)} / {formatNumber(election.eligibleVoters)} votes
          </span>
        </div>
      </div>
      <Link to={`/elections/${election.id}`}>
        <Button variant="outline" size="sm" className="w-full">
          View
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div>
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { elections, isLoading, fetchElections } = useElectionStore();

  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  const activeElections = elections.filter((e) => e.status === 'active');
  const upcomingElections = elections.filter((e) => e.status === 'scheduled');
  const completedElections = elections.filter(
    (e) => e.status === 'closed' || e.status === 'results_published'
  );
  const votesCast = elections.reduce((sum, e) => sum + e.votesCast, 0);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.fullName}
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Here's an overview of your voting activity
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Vote}
            label="Active Elections"
            value={activeElections.length}
            color="bg-success-500"
          />
          <StatCard
            icon={Calendar}
            label="Upcoming Elections"
            value={upcomingElections.length}
            color="bg-info-500"
          />
          <StatCard
            icon={CheckCircle}
            label="Completed Elections"
            value={completedElections.length}
            color="bg-gray-500"
          />
          <StatCard
            icon={BarChart3}
            label="Votes Cast"
            value={formatNumber(votesCast)}
            color="bg-primary-500"
          />
        </div>

        {activeElections.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Active Elections
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {activeElections.map((election) => (
                <ElectionCard key={election.id} election={election} />
              ))}
            </div>
          </section>
        )}

        {upcomingElections.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Elections
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {upcomingElections.map((election) => (
                <ElectionCard key={election.id} election={election} />
              ))}
            </div>
          </section>
        )}

        {activeElections.length === 0 && upcomingElections.length === 0 && (
          <Card className="py-12 text-center">
            <Clock className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              No Active Elections
            </h3>
            <p className="mt-1 text-gray-500">
              There are no active or upcoming elections at the moment.
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
