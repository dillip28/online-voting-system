import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Pencil,
  Users,
  Vote,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import { electionsApi } from '@/api/elections';
import { candidatesApi } from '@/api/candidates';
import type { ElectionStatus } from '@/types';
import AdminLayout from '@/layouts/admin-layout';

const statusTransitions: Partial<Record<ElectionStatus, { next: ElectionStatus; label: string }[]>> = {
  draft: [{ next: 'scheduled', label: 'Schedule' }],
  scheduled: [{ next: 'active', label: 'Start Election' }],
  active: [{ next: 'closed', label: 'Close Election' }],
  closed: [{ next: 'results_published', label: 'Publish Results' }],
};

export default function ElectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [election, setElection] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [voters, setVoters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; next: ElectionStatus | null }>({
    open: false,
    next: null,
  });
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [removeVoterId, setRemoveVoterId] = useState<string | null>(null);

  useEffect(() => {
    const fetchElection = async () => {
      try {
        const res = await electionsApi.getElection(id!);
        setElection(res.data || null);
        const candRes = await electionsApi.getElectionCandidates(id!);
        setCandidates(Array.isArray(candRes.data) ? candRes.data : []);
        try {
          const voterRes = await electionsApi.getElectionVoters(id!);
          setVoters(voterRes.data?.data || []);
        } catch { setVoters([]); }
      } catch {
        setElection(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchElection();
  }, [id]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-200 border-t-primary-600" />
        </div>
      </AdminLayout>
    );
  }

  if (!election) {
    return (
      <AdminLayout>
        <EmptyState
          icon={AlertTriangle}
          title="Election not found"
          description="The election you're looking for doesn't exist."
          action={{
            children: 'Back to Elections',
            onClick: () => navigate('/admin/elections'),
          }}
        />
      </AdminLayout>
    );
  }

  const transitions = statusTransitions[election.status as ElectionStatus] ?? [];

  const handleStatusChange = async (next: ElectionStatus) => {
    try {
      if (next === 'scheduled' || next === 'active') {
        await fetch(`/api/elections/${id}/${next === 'active' ? 'open' : 'schedule'}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        });
      } else if (next === 'closed') {
        await fetch(`/api/elections/${id}/close`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        });
      } else if (next === 'results_published') {
        await fetch(`/api/elections/${id}/publish-results`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        });
      }
      const res = await electionsApi.getElection(id!);
      setElection(res.data || null);
      toast('success', `Election status changed to ${next.replace('_', ' ')}.`);
    } catch {
      toast('error', 'Failed to change election status.');
    }
    setStatusDialog({ open: false, next: null });
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    try {
      await candidatesApi.deleteCandidate(candidateId);
      setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
      toast('success', 'Candidate has been removed from the election.');
    } catch {
      toast('error', 'Failed to remove candidate.');
    }
    setDeleteCandidateId(null);
  };

  const handleRemoveVoter = (voterId: string) => {
    setVoters((prev) => prev.filter((v) => v.id !== voterId));
    setRemoveVoterId(null);
    toast('success', 'Voter has been removed from eligible voters.');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'candidates', label: 'Candidates', icon: Users },
    { id: 'voters', label: 'Voters', icon: UserCheck },
    { id: 'results', label: 'Results', icon: Vote },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/elections')}
              className="mb-2 -ml-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Elections
            </Button>
            <h1 className="text-[22px] font-semibold text-surface-900">{election.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              <StatusBadge status={election.status as ElectionStatus} />
              <span className="text-sm text-surface-500">{election.organization}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {transitions.map((t: any) => (
              <Button
                key={t.next}
                variant={t.next === 'active' ? 'success' : 'primary'}
                size="sm"
                onClick={() => setStatusDialog({ open: true, next: t.next })}
              >
                {t.next === 'active' && <CheckCircle2 className="mr-2 h-4 w-4" />}
                {t.next === 'results_published' && <BarChart3 className="mr-2 h-4 w-4" />}
                {t.label}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/elections/${election.id}/edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 text-[15px] font-semibold text-surface-900">Election Details</h3>
              <dl className="space-y-3">
                <div className="flex justify-between border-b border-surface-100 pb-3">
                  <dt className="text-sm text-surface-500">Type</dt>
                  <dd className="text-sm font-medium capitalize text-surface-900">{election.type}</dd>
                </div>
                <div className="flex justify-between border-b border-surface-100 pb-3">
                  <dt className="text-sm text-surface-500">Organization</dt>
                  <dd className="text-sm font-medium text-surface-900">{election.organization}</dd>
                </div>
                <div className="flex justify-between border-b border-surface-100 pb-3">
                  <dt className="text-sm text-surface-500">Positions</dt>
                  <dd className="text-sm font-medium text-surface-900">{election.positionsCount ?? election.positions?.length ?? 0}</dd>
                </div>
                <div className="flex justify-between border-b border-surface-100 pb-3">
                  <dt className="text-sm text-surface-500">Max Selections</dt>
                  <dd className="text-sm font-medium text-surface-900">{election.maxSelections}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">NOTA Enabled</dt>
                  <dd className="text-sm font-medium text-surface-900">
                    {election.enableNota ? 'Yes' : 'No'}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card>
              <h3 className="mb-4 text-[15px] font-semibold text-surface-900">Schedule & Stats</h3>
              <dl className="space-y-3">
                <div className="flex justify-between border-b border-surface-100 pb-3">
                  <dt className="text-sm text-surface-500">Start Date</dt>
                  <dd className="text-sm font-medium text-surface-900">
                    {formatDateTime(election.startTime ?? election.startDate)}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-surface-100 pb-3">
                  <dt className="text-sm text-surface-500">End Date</dt>
                  <dd className="text-sm font-medium text-surface-900">
                    {formatDateTime(election.endTime ?? election.endDate)}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-surface-100 pb-3">
                  <dt className="text-sm text-surface-500">Eligible Voters</dt>
                  <dd className="text-sm font-medium text-surface-900">
                    {election.eligibleVoters.toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-surface-100 pb-3">
                  <dt className="text-sm text-surface-500">Votes Cast</dt>
                  <dd className="text-sm font-medium text-surface-900">
                    {election.votesCast.toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Candidates</dt>
                  <dd className="text-sm font-medium text-surface-900">{election.totalCandidates}</dd>
                </div>
              </dl>
            </Card>

            <Card className="lg:col-span-2">
              <h3 className="mb-4 text-[15px] font-semibold text-surface-900">Description</h3>
              <p className="text-sm leading-relaxed text-surface-600">{election.description}</p>
            </Card>
          </div>
        )}

        {activeTab === 'candidates' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-surface-500">
                {candidates.length} candidate(s)
              </p>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Candidate
              </Button>
            </div>

            {candidates.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No candidates yet"
                description="Add candidates to this election."
              />
            ) : (
              <Card className="!p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Votes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <p className="font-medium text-surface-900">{c.name}</p>
                          <p className="text-xs text-surface-500">{c.position?.title ?? 'N/A'}</p>
                        </TableCell>
                        <TableCell>{c.party ?? 'Independent'}</TableCell>
                        <TableCell>
                          <StatusBadge status={c.status} />
                        </TableCell>
                        <TableCell className="text-center">{c.votesReceived}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {c.status === 'pending' && (
                              <>
                                <Button variant="ghost" size="sm">
                                  <CheckCircle2 className="h-4 w-4 text-success-500" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <UserX className="h-4 w-4 text-danger-500" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteCandidateId(c.id)}
                            >
                              <Trash2 className="h-4 w-4 text-danger-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'voters' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-surface-500">
                {voters.length} eligible voter(s)
              </p>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Voter
              </Button>
            </div>

            {voters.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No voters"
                description="Add eligible voters to this election."
              />
            ) : (
              <Card className="!p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {voters.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium text-surface-900">{v.fullName}</TableCell>
                        <TableCell className="text-surface-500">{v.email}</TableCell>
                        <TableCell>{v.studentId ?? 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={v.isVerified ? 'success' : 'warning'}>
                            {v.isVerified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRemoveVoterId(v.id)}
                          >
                            <Trash2 className="h-4 w-4 text-danger-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <Card>
            {election.publishedResults || election.status === 'results_published' ? (
              <div className="space-y-4">
                <h3 className="text-[15px] font-semibold text-surface-900">Published Results</h3>
                <p className="text-sm text-surface-500">
                  Results for this election have been published and are available to voters.
                </p>
                <Button onClick={() => navigate('/admin/results')}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Results Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-[15px] font-semibold text-surface-900">Results Not Published</h3>
                <p className="text-sm text-surface-500">
                  {election.status === 'closed'
                    ? 'This election is closed. You can publish the results now.'
                    : 'Results will be available after the election closes.'}
                </p>
                {election.status === 'closed' && (
                  <Button
                    onClick={() =>
                      setStatusDialog({ open: true, next: 'results_published' })
                    }
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Publish Results
                  </Button>
                )}
              </div>
            )}
          </Card>
        )}
      </div>

      <ConfirmationDialog
        isOpen={statusDialog.open}
        onClose={() => setStatusDialog({ open: false, next: null })}
        onConfirm={() => statusDialog.next && handleStatusChange(statusDialog.next)}
        title="Change Election Status"
        message={`Are you sure you want to change the status to "${statusDialog.next?.replace('_', ' ')}"?`}
        confirmLabel="Confirm"
        confirmVariant="primary"
      />

      <ConfirmationDialog
        isOpen={deleteCandidateId !== null}
        onClose={() => setDeleteCandidateId(null)}
        onConfirm={() => deleteCandidateId && handleDeleteCandidate(deleteCandidateId)}
        title="Remove Candidate"
        message="Are you sure you want to remove this candidate from the election?"
        confirmLabel="Remove"
        confirmVariant="danger"
      />

      <ConfirmationDialog
        isOpen={removeVoterId !== null}
        onClose={() => setRemoveVoterId(null)}
        onConfirm={() => removeVoterId && handleRemoveVoter(removeVoterId)}
        title="Remove Voter"
        message="Are you sure you want to remove this voter from eligible voters?"
        confirmLabel="Remove"
        confirmVariant="danger"
      />
    </AdminLayout>
  );
}
