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
import { formatDate, formatNumber } from '@/lib/utils';
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
  iconBg,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  iconBg: string;
}) {
  return (
    <Card className="border border-surface-200 rounded-lg bg-white">
      <div className="flex items-center gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[13px] text-surface-500">{label}</p>
          <p className="text-xl font-bold text-primary-700">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function ElectionCard({ election }: { election: Election }) {
  return (
    <Card className="border border-surface-200 rounded-lg bg-white flex flex-col justify-between">
      <div>
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-[15px] font-semibold text-primary-700 leading-snug">
            {election.title}
          </h3>
          <Badge variant={typeBadgeVariant[election.type]} className="text-xs">
            {election.type}
          </Badge>
        </div>
        <p className="mb-3 text-[13px] text-surface-500">
          {election.organization}
        </p>
        <div className="mb-3 flex items-center gap-4 text-[13px] text-surface-600">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-surface-400" />
            {formatDate(election.startDate)} — {formatDate(election.endDate)}
          </span>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <StatusBadge status={election.status} />
          <span className="text-[13px] text-surface-500">
            {formatNumber(election.votesCast)} / {formatNumber(election.eligibleVoters)} votes
          </span>
        </div>
      </div>
      <Link to={`/elections/${election.id}`}>
        <Button variant="outline" size="sm" className="w-full border-surface-200 text-primary-600 hover:bg-primary-50 rounded-md">
          View Details
          <ArrowRight className="ml-2 h-3.5 w-3.5" />
        </Button>
      </Link>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-7 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div>
        <Skeleton className="mb-4 h-5 w-48" />
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
          <h1 className="text-[22px] font-bold text-primary-700">
            Welcome back, {user?.fullName}
          </h1>
          <p className="mt-1 text-[14px] text-surface-500">
            Here's an overview of your voting activity
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Vote}
            label="Active Elections"
            value={activeElections.length}
            iconBg="bg-accent-50 text-accent-600"
          />
          <StatCard
            icon={Calendar}
            label="Upcoming Elections"
            value={upcomingElections.length}
            iconBg="bg-primary-50 text-primary-600"
          />
          <StatCard
            icon={CheckCircle}
            label="Completed Elections"
            value={completedElections.length}
            iconBg="bg-surface-100 text-surface-600"
          />
          <StatCard
            icon={BarChart3}
            label="Votes Cast"
            value={formatNumber(votesCast)}
            iconBg="bg-accent-50 text-accent-600"
          />
        </div>

        {activeElections.length > 0 && (
          <section>
            <h2 className="mb-4 text-[16px] font-semibold text-primary-700">
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
            <h2 className="mb-4 text-[16px] font-semibold text-primary-700">
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
          <Card className="border border-surface-200 rounded-lg bg-white py-12 text-center">
            <Clock className="mx-auto mb-4 h-10 w-10 text-surface-300" />
            <h3 className="text-[16px] font-semibold text-primary-700">
              No Active Elections
            </h3>
            <p className="mt-1 text-[14px] text-surface-500">
              There are no active or upcoming elections at the moment.
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
