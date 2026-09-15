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
                'flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-medium transition-colors',
                index < currentIndex
                  ? 'bg-accent-600 text-white'
                  : index === currentIndex
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-200 text-surface-500'
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
                'hidden text-[13px] font-medium sm:block',
                index <= currentIndex
                  ? 'text-primary-700'
                  : 'text-surface-400'
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'mx-3 h-0.5 w-8 sm:w-16',
                index < currentIndex ? 'bg-accent-500' : 'bg-surface-200'
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
        <div className="flex items-start gap-3 rounded-lg border border-surface-200 bg-surface-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-surface-500" />
          <div className="flex-1">
            <p className="text-[13px] font-medium text-primary-700">
              Your vote has not been submitted yet.
            </p>
            <p className="mt-1 text-[13px] text-surface-500">
              Please review your selections carefully. Once submitted, your vote cannot be changed.
            </p>
          </div>
          <button
            onClick={() => setWarningDismissed(true)}
            className="text-surface-400 hover:text-surface-600 text-lg leading-none"
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
            <h3 className="mb-4 text-[15px] font-semibold text-primary-700">
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
                      'flex items-start gap-4 rounded-lg border p-4 text-left transition-all',
                      isSelected
                        ? 'border-primary-500 bg-primary-50/50 ring-1 ring-primary-500'
                        : 'border-surface-200 hover:border-surface-300 bg-white'
                    )}
                  >
                    <Avatar src={candidate.photo} name={candidate.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[14px] font-medium text-primary-700">
                          {candidate.name}
                        </h4>
                        {candidate.party && (
                          <Badge variant="outline" className="text-xs">
                            {candidate.party}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-[13px] text-surface-500 leading-relaxed">
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
                          : 'border-surface-300'
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
          <h3 className="mb-4 text-[15px] font-semibold text-primary-700">
            None of the Above (NOTA)
          </h3>
          <Button
            variant="outline"
            className="border-surface-200 text-primary-600 hover:bg-primary-50 rounded-md"
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
      <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
        <h3 className="text-[14px] font-semibold text-primary-700">Your Selections</h3>
        <p className="mt-1 text-[13px] text-surface-500">
          Please review your selections before submitting.
        </p>
      </div>

      <div className="space-y-3">
        {positions.map((position) => {
          const selectedId = selections.get(position.id);
          const candidate = candidates.find((c) => c.id === selectedId);
          const isNota = selectedId === 'nota';

          return (
            <div
              key={position.id}
              className="flex items-center justify-between rounded-lg border border-surface-200 bg-white p-4"
            >
              <div>
                <p className="text-[12px] text-surface-400 uppercase tracking-wide">{position.title}</p>
                <p className="text-[14px] font-medium text-primary-700">
                  {isNota ? 'None of the Above (NOTA)' : candidate?.name || 'Not selected'}
                </p>
              </div>
              {selectedId && (
                <CheckCircle className="h-5 w-5 text-accent-600" />
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-surface-500" />
          <div>
            <p className="text-[13px] font-semibold text-primary-700">
              Important
            </p>
            <p className="mt-1 text-[13px] text-surface-500">
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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
          <Vote className="h-7 w-7 text-primary-600" />
        </div>
        <h3 className="text-[16px] font-semibold text-primary-700">
          Confirm Your Vote
        </h3>
        <p className="mt-1 text-[14px] text-surface-500">
          Please confirm that your selections are correct before submitting.
        </p>
      </div>

      <div className="rounded-lg border border-surface-200 bg-white p-4">
        <Checkbox
          label="I confirm that my selections are correct and I want to submit my vote"
          checked={confirmed}
          onChange={setConfirmed}
        />
      </div>

      <Button
        size="lg"
        className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-md"
        disabled={!confirmed || isSubmitting}
        onClick={submitVote}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-50">
        <CheckCircle className="h-8 w-8 text-accent-600" />
      </div>
      <div>
        <h3 className="text-[20px] font-bold text-primary-700">
          Vote Submitted Successfully
        </h3>
        <p className="mt-2 text-[14px] text-surface-500">Your vote has been recorded.</p>
      </div>

      <div className="mx-auto max-w-sm space-y-3 rounded-lg border border-surface-200 bg-white p-6 text-left">
        <div className="flex justify-between">
          <span className="text-[13px] text-surface-500">Election</span>
          <span className="text-[14px] font-medium text-primary-700">
            {selectedElection?.title}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[13px] text-surface-500">Date & Time</span>
          <span className="text-[14px] font-medium text-primary-700">
            {submissionResult?.submittedAt
              ? new Date(submissionResult.submittedAt).toLocaleString()
              : '-'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[13px] text-surface-500">Confirmation ID</span>
          <span className="font-mono text-[14px] font-medium text-accent-600">
            {submissionResult?.confirmationId}
          </span>
        </div>
      </div>

      <Link to="/dashboard">
        <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white rounded-md">
          Return to Dashboard
        </Button>
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
          <Skeleton className="h-6 w-64 mx-auto" />
          <Skeleton className="h-10 w-full" />
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
          className="inline-flex items-center gap-2 text-[13px] font-medium text-surface-500 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Election
        </Link>

        <div className="text-center">
          <h1 className="text-[18px] font-bold text-primary-700">
            {currentElection.title}
          </h1>
        </div>

        {currentStep !== 'success' && <StepIndicator currentStep={currentStep} />}

        <Card className="border border-surface-200 rounded-lg bg-white">
          {currentStep === 'select' && <SelectStep />}
          {currentStep === 'review' && <ReviewStep />}
          {currentStep === 'confirm' && <ConfirmStep />}
          {currentStep === 'success' && <SuccessStep />}
        </Card>

        {currentStep === 'select' && (
          <div className="flex justify-end">
            <Button
              size="lg"
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-md"
              onClick={() => useVotingStore.getState().setStep('review')}
            >
              Review Selections
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              size="lg"
              className="border-surface-200 text-primary-600 hover:bg-primary-50 rounded-md"
              onClick={() => useVotingStore.getState().setStep('select')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Edit
            </Button>
            <Button
              size="lg"
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-md"
              onClick={() => useVotingStore.getState().setStep('confirm')}
            >
              Proceed to Submit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
