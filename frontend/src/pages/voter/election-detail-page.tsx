import { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Users,
  Vote,
  BarChart3,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';
import { Button, Card, Badge, Avatar, StatusBadge } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { ErrorState } from '@/components/ui';
import { useElectionStore } from '@/store/election-store';
import type { Candidate, ElectionType } from '@/types';
import DashboardLayout from '@/layouts/dashboard-layout';

const typeBadgeVariant: Record<ElectionType, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  presidential: 'danger',
  parliamentary: 'info',
  local: 'default',
  student: 'success',
  organizational: 'warning',
  custom: 'default',
};

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <Card hover className="flex flex-col items-center text-center">
      <Avatar
        src={candidate.photo}
        name={candidate.name}
        size="lg"
        className="mb-3"
      />
      <h4 className="font-semibold text-gray-900 dark:text-white">{candidate.name}</h4>
      {candidate.party && (
        <Badge variant="outline" className="mt-1">
          {candidate.party}
        </Badge>
      )}
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {candidate.manifesto.length > 100
          ? candidate.manifesto.slice(0, 100) + '...'
          : candidate.manifesto}
      </p>
    </Card>
  );
}

export default function ElectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentElection, candidates, isLoading, error, fetchElection, fetchCandidates } = useElectionStore();

  useEffect(() => {
    if (id) {
      fetchElection(id);
      fetchCandidates(id);
    }
  }, [id, fetchElection, fetchCandidates]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !currentElection) {
    return (
      <DashboardLayout>
        <ErrorState
          title="Election not found"
          message={error || 'The election you are looking for does not exist.'}
          onRetry={() => navigate('/elections')}
        />
      </DashboardLayout>
    );
  }

  const election = currentElection;
  const isActive = election.status === 'active';
  const hasResults = election.publishedResults;
  const now = new Date();
  const endDate = new Date(election.endDate);
  const hasEnded = now > endDate;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Link
          to="/elections"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Elections
        </Link>

        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {election.title}
                </h1>
                <Badge variant={typeBadgeVariant[election.type]}>{election.type}</Badge>
                <StatusBadge status={election.status} />
              </div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {election.organization}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <InfoItem icon={Calendar} label="Start Date" value={formatDate(election.startDate)} />
          <InfoItem icon={Calendar} label="End Date" value={formatDate(election.endDate)} />
          <InfoItem icon={Vote} label="Positions" value={election.totalPositions} />
          <InfoItem icon={Users} label="Candidates" value={election.totalCandidates} />
          <InfoItem icon={Users} label="Eligible Voters" value={formatNumber(election.eligibleVoters)} />
          <InfoItem icon={BarChart3} label="Votes Cast" value={formatNumber(election.votesCast)} />
        </div>

        <Card>
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Description</h2>
          <p className="text-gray-600 dark:text-gray-300">{election.description}</p>
        </Card>

        <div className="rounded-xl border border-info-200 bg-info-50 p-4 dark:border-info-800 dark:bg-info-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-info-600 dark:text-info-400" />
            <div>
              <h3 className="font-medium text-info-800 dark:text-info-300">Voting Instructions</h3>
              <ul className="mt-2 space-y-1 text-sm text-info-700 dark:text-info-400">
                <li>• Review all candidates before making your selection</li>
                <li>• You can select one candidate per position</li>
                <li>• Your vote is final and cannot be changed after submission</li>
                <li>• You will receive a confirmation ID after submitting your vote</li>
              </ul>
            </div>
          </div>
        </div>

        {candidates.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Candidates</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {candidates.map((candidate) => (
                <CandidateCard key={candidate.id} candidate={candidate} />
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          {isActive && !hasEnded && (
            <Link to={`/elections/${election.id}/vote`}>
              <Button size="lg">
                <Vote className="mr-2 h-5 w-5" />
                Start Voting
              </Button>
            </Link>
          )}
          {hasResults && (
            <Link to={`/elections/${election.id}/results`}>
              <Button variant="outline" size="lg">
                <BarChart3 className="mr-2 h-5 w-5" />
                View Results
              </Button>
            </Link>
          )}
          {hasEnded && !hasResults && (
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="h-5 w-5" />
              <span>Results are being tabulated</span>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
