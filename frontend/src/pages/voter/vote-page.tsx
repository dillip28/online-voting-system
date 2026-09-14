import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Vote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Card, Checkbox, Avatar, Badge } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { ErrorState } from '@/components/ui';
import { useElectionStore } from '@/store/election-store';
import { useVotingStore } from '@/store/voting-store';
import DashboardLayout from '@/layouts/dashboard-layout';

type Step = 'select' | 'review' | 'confirm' | 'success';

const steps: { id: Step; label: string }[] = [
  { id: 'select', label: 'Select Candidates' },
  { id: 'review', label: 'Review' },
  { id: 'confirm', label: 'Submit' },
];

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                index < currentIndex
                  ? 'bg-success-500 text-white'
                  : index === currentIndex
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              )}
            >
              {index < currentIndex ? (
                <Check className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <span
              className={cn(
                'hidden text-sm font-medium sm:block',
                index <= currentIndex
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-400'
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'mx-3 h-0.5 w-8 sm:w-16',
                index < currentIndex ? 'bg-success-500' : 'bg-gray-200 dark:bg-gray-700'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function SelectStep() {
  const { candidates, currentElection } = useElectionStore();
  const { selections, selectCandidate, removeSelection: _removeSelection } = useVotingStore();
  const [warningDismissed, setWarningDismissed] = useState(false);

  const positions = Array.from(
    new Map(candidates.map((c) => [c.positionId, { id: c.positionId, title: c.position?.title || `Position ${c.positionId}` }])).values()
  );

  return (
    <div className="space-y-6">
      {!warningDismissed && (
        <div className="flex items-start gap-3 rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-warning-800 dark:text-warning-300">
              Your vote has not been submitted yet.
            </p>
            <p className="mt-1 text-sm text-warning-700 dark:text-warning-400">
              Please review your selections carefully. Once submitted, your vote cannot be changed.
            </p>
          </div>
          <button
            onClick={() => setWarningDismissed(true)}
            className="text-warning-600 hover:text-warning-800"
          >
            ×
          </button>
        </div>
      )}

      {positions.map((position) => {
        const positionCandidates = candidates.filter(
          (c) => c.positionId === position.id && c.status === 'approved'
        );
        const selectedId = selections.get(position.id);

        return (
          <div key={position.id}>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {position.title}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {positionCandidates.map((candidate) => {
                const isSelected = selectedId === candidate.id;
                return (
                  <button
                    key={candidate.id}
                    onClick={() => selectCandidate(position.id, candidate.id)}
                    className={cn(
                      'flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all',
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    )}
                  >
                    <Avatar src={candidate.photo} name={candidate.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {candidate.name}
                        </h4>
                        {candidate.party && (
                          <Badge variant="outline" className="text-xs">
                            {candidate.party}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {candidate.manifesto.length > 150
                          ? candidate.manifesto.slice(0, 150) + '...'
                          : candidate.manifesto}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                        isSelected
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300 dark:border-gray-600'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {currentElection?.enableNota && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            None of the Above (NOTA)
          </h3>
          <Button
            variant="outline"
            onClick={() => {
              positions.forEach((p) => {
                if (!selections.has(p.id)) {
                  selectCandidate(p.id, 'nota');
                }
              });
            }}
          >
            Select NOTA for all unselected positions
          </Button>
        </div>
      )}
    </div>
  );
}

function ReviewStep() {
  const { candidates, currentElection: _currentElection } = useElectionStore();
  const { selections } = useVotingStore();

  const positions = Array.from(
    new Map(candidates.map((c) => [c.positionId, { id: c.positionId, title: c.position?.title || `Position ${c.positionId}` }])).values()
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="font-medium text-gray-900 dark:text-white">Your Selections</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please review your selections before submitting.
        </p>
      </div>

      <div className="space-y-4">
        {positions.map((position) => {
          const selectedId = selections.get(position.id);
          const candidate = candidates.find((c) => c.id === selectedId);
          const isNota = selectedId === 'nota';

          return (
            <div
              key={position.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-700"
            >
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{position.title}</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {isNota ? 'None of the Above (NOTA)' : candidate?.name || 'Not selected'}
                </p>
              </div>
              {selectedId && (
                <CheckCircle className="h-5 w-5 text-success-500" />
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-600" />
          <div>
            <p className="text-sm font-medium text-warning-800 dark:text-warning-300">
              Important
            </p>
            <p className="mt-1 text-sm text-warning-700 dark:text-warning-400">
              Once submitted, your vote cannot be changed or withdrawn. Please ensure all selections are correct.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmStep() {
  const { isSubmitting, submitVote } = useVotingStore();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
          <Vote className="h-8 w-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Confirm Your Vote
        </h3>
        <p className="mt-1 text-gray-500">
          Please confirm that your selections are correct before submitting.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <Checkbox
          label="I confirm that my selections are correct and I want to submit my vote"
          checked={confirmed}
          onChange={setConfirmed}
        />
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={!confirmed || isSubmitting}
        onClick={submitVote}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Submitting...
          </>
        ) : (
          'Confirm & Submit Vote'
        )}
      </Button>
    </div>
  );
}

function SuccessStep() {
  const { submissionResult, selectedElection } = useVotingStore();

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30">
        <CheckCircle className="h-10 w-10 text-success-500" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          Vote Submitted Successfully
        </h3>
        <p className="mt-2 text-gray-500">Your vote has been recorded.</p>
      </div>

      <div className="mx-auto max-w-sm space-y-3 rounded-xl border border-gray-200 p-6 text-left dark:border-gray-700">
        <div className="flex justify-between">
          <span className="text-gray-500">Election</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {selectedElection?.title}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Date & Time</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {submissionResult?.submittedAt
              ? new Date(submissionResult.submittedAt).toLocaleString()
              : '-'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Confirmation ID</span>
          <span className="font-mono font-medium text-primary-600 dark:text-primary-400">
            {submissionResult?.confirmationId}
          </span>
        </div>
      </div>

      <Link to="/dashboard">
        <Button size="lg">Return to Dashboard</Button>
      </Link>
    </div>
  );
}

export default function VotePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentElection, isLoading, error, fetchElection, fetchCandidates } = useElectionStore();
  const { currentStep, setSelectedElection, resetVoting } = useVotingStore();

  useEffect(() => {
    if (id) {
      fetchElection(id);
      fetchCandidates(id);
    }
    return () => resetVoting();
  }, [id, fetchElection, fetchCandidates, resetVoting]);

  useEffect(() => {
    if (currentElection) {
      setSelectedElection(currentElection);
    }
  }, [currentElection, setSelectedElection]);

  useEffect(() => {
    if (currentElection) {
      const now = new Date();
      const start = new Date(currentElection.startDate);
      const end = new Date(currentElection.endDate);
      if (now < start || now > end || currentElection.status !== 'active') {
        navigate(`/elections/${id}`);
      }
    }
  }, [currentElection, id, navigate]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl space-y-6">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !currentElection) {
    return (
      <DashboardLayout>
        <ErrorState
          title="Error"
          message={error || 'Could not load election'}
          onRetry={() => navigate('/elections')}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          to={`/elections/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Election
        </Link>

        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {currentElection.title}
          </h1>
        </div>

        {currentStep !== 'success' && <StepIndicator currentStep={currentStep} />}

        <Card>
          {currentStep === 'select' && <SelectStep />}
          {currentStep === 'review' && <ReviewStep />}
          {currentStep === 'confirm' && <ConfirmStep />}
          {currentStep === 'success' && <SuccessStep />}
        </Card>

        {currentStep === 'select' && (
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={() => useVotingStore.getState().setStep('review')}
            >
              Review Selections
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              size="lg"
              onClick={() => useVotingStore.getState().setStep('select')}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Edit
            </Button>
            <Button
              size="lg"
              onClick={() => useVotingStore.getState().setStep('confirm')}
            >
              Proceed to Submit
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
