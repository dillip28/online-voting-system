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
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-100">
        <Icon className="h-4 w-4 text-surface-500" />
      </div>
      <div>
        <p className="text-[12px] text-surface-400 uppercase tracking-wide">{label}</p>
        <p className="text-[14px] font-medium text-primary-700">{value}</p>
      </div>
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <Card className="border border-surface-200 rounded-lg bg-white flex flex-col items-center text-center p-5">
      <Avatar
        src={candidate.photo}
        name={candidate.name}
        size="lg"
        className="mb-3"
      />
      <h4 className="text-[15px] font-semibold text-primary-700">{candidate.name}</h4>
      {candidate.party && (
        <Badge variant="outline" className="mt-1 text-xs">
          {candidate.party}
        </Badge>
      )}
      <p className="mt-2 text-[13px] text-surface-500 leading-relaxed">
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
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
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
          className="inline-flex items-center gap-2 text-[13px] font-medium text-surface-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Elections
        </Link>

        <Card className="border border-surface-200 rounded-lg bg-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[22px] font-bold text-primary-700">
                  {election.title}
                </h1>
                <Badge variant={typeBadgeVariant[election.type]} className="text-xs">{election.type}</Badge>
                <StatusBadge status={election.status} />
              </div>
              <p className="mt-2 text-[14px] text-surface-500">
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

        <Card className="border border-surface-200 rounded-lg bg-white">
          <h2 className="mb-3 text-[16px] font-semibold text-primary-700">Description</h2>
          <p className="text-[14px] text-surface-600 leading-relaxed">{election.description}</p>
        </Card>

        <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-primary-600 shrink-0" />
            <div>
              <h3 className="text-[14px] font-semibold text-primary-700">Voting Instructions</h3>
              <ul className="mt-2 space-y-1 text-[13px] text-primary-600">
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
            <h2 className="mb-4 text-[16px] font-semibold text-primary-700">Candidates</h2>
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
              <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white rounded-md">
                <Vote className="mr-2 h-4 w-4" />
                Start Voting
              </Button>
            </Link>
          )}
          {hasResults && (
            <Link to={`/elections/${election.id}/results`}>
              <Button variant="outline" size="lg" className="border-surface-200 text-primary-600 hover:bg-primary-50 rounded-md">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Results
              </Button>
            </Link>
          )}
          {hasEnded && !hasResults && (
            <div className="flex items-center gap-2 text-surface-500 text-[14px]">
              <Clock className="h-4 w-4" />
              <span>Results are being tabulated</span>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
