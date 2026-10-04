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
  Trash2,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import * as storage from '@/services/electionService';
import * as positionService from '@/services/positionService';
import * as candidateService from '@/services/candidateService';
import { addAuditLog } from '@/services/auditService';
import { useAuthStore } from '@/store/auth-store';
import type { ElectionStatus, Position } from '@/types';
import AdminLayout from '@/layouts/admin-layout';

const statusTransitions: Partial<Record<ElectionStatus, { next: ElectionStatus; label: string }[]>> = {
  draft: [
    { next: 'scheduled', label: 'Schedule' },
    { next: 'active', label: 'Activate' },
  ],
  scheduled: [
    { next: 'active', label: 'Start Election' },
    { next: 'draft', label: 'Revert to Draft' },
  ],
  active: [{ next: 'closed', label: 'Close Election' }],
  closed: [{ next: 'results_published', label: 'Publish Results' }],
};

export default function ElectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [election, setElection] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; next: ElectionStatus | null }>({
    open: false,
    next: null,
  });
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  const [showPositionModal, setShowPositionModal] = useState(false);
  const [editPosition, setEditPosition] = useState<Position | null>(null);
  const [positionTitle, setPositionTitle] = useState('');
  const [positionDescription, setPositionDescription] = useState('');
  const [deletePositionId, setDeletePositionId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const timer = setTimeout(async () => {
      const e = await storage.getElectionById(id);
      setElection(e);
      if (e) {
        const cands = await candidateService.getCandidates(id);
        setCandidates(cands);
      }
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
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
    if (next === 'scheduled') await storage.scheduleElection(id!);
    else if (next === 'active') await storage.openElection(id!);
    else if (next === 'closed') await storage.closeElection(id!);
    else if (next === 'results_published') await storage.publishResults(id!);
    else if (next === 'draft') await storage.unpublishElection(id!);

    addAuditLog({
      userId: user?.id || 'admin',
      userName: user?.fullName || 'Admin',
      userRole: user?.role || 'admin',
      action: `election.${next === 'active' ? 'activate' : next === 'closed' ? 'close' : next === 'results_published' ? 'publish' : next === 'scheduled' ? 'schedule' : 'update'}`,
      resource: 'election',
      resourceId: id!,
      details: `Election status changed to ${next.replace('_', ' ')}`,
    });

    const updated = await storage.getElectionById(id!);
    setElection(updated);
    toast('success', `Election status changed to ${next.replace('_', ' ')}.`);
    setStatusDialog({ open: false, next: null });
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    await candidateService.deleteCandidate(candidateId);
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    toast('success', 'Candidate has been removed from the election.');
    setDeleteCandidateId(null);
  };

  const openAddPosition = () => {
    setEditPosition(null);
    setPositionTitle('');
    setPositionDescription('');
    setShowPositionModal(true);
  };

  const openEditPosition = (position: Position) => {
    setEditPosition(position);
    setPositionTitle(position.title);
    setPositionDescription(position.description || '');
    setShowPositionModal(true);
  };

  const handleSavePosition = async () => {
    if (!positionTitle.trim()) {
      toast('error', 'Position title is required.');
      return;
    }

    if (editPosition) {
      await positionService.updatePosition(id!, editPosition.id, {
        title: positionTitle,
        description: positionDescription,
      });
      toast('success', 'Position updated.');
    } else {
      await positionService.addPosition(id!, {
        title: positionTitle,
        description: positionDescription,
      });
      addAuditLog({
        userId: user?.id || 'admin',
        userName: user?.fullName || 'Admin',
        userRole: user?.role || 'admin',
        action: 'position.create',
        resource: 'position',
        resourceId: id!,
        details: `Added position: ${positionTitle}`,
      });
      toast('success', 'Position added.');
    }

    const updated = await storage.getElectionById(id!);
    setElection(updated);
    setShowPositionModal(false);
    setPositionTitle('');
    setPositionDescription('');
    setEditPosition(null);
  };

  const handleDeletePosition = async (positionId: string) => {
    const success = await positionService.deletePosition(id!, positionId);
    if (!success) {
      toast('error', 'Cannot delete position with existing candidates. Remove candidates first.');
      setDeletePositionId(null);
      return;
    }
    const updated = await storage.getElectionById(id!);
    setElection(updated);
    toast('success', 'Position deleted.');
    setDeletePositionId(null);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'positions', label: 'Positions', icon: Vote },
    { id: 'candidates', label: 'Candidates', icon: Users },
    { id: 'results', label: 'Results', icon: BarChart3 },
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
                variant={t.next === 'active' ? 'success' : t.next === 'results_published' ? 'primary' : 'primary'}
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
                  <dd className="text-sm font-medium text-surface-900">{election.positions?.length || 0}</dd>
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
                    {formatDateTime(election.startDate)}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-surface-100 pb-3">
                  <dt className="text-sm text-surface-500">End Date</dt>
                  <dd className="text-sm font-medium text-surface-900">
                    {formatDateTime(election.endDate)}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-surface-100 pb-3">
                  <dt className="text-sm text-surface-500">Eligible Voters</dt>
                  <dd className="text-sm font-medium text-surface-900">
                    {(election.eligibleVoters || 0).toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-surface-100 pb-3">
                  <dt className="text-sm text-surface-500">Votes Cast</dt>
                  <dd className="text-sm font-medium text-surface-900">
                    {(election.votesCast || 0).toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-500">Candidates</dt>
                  <dd className="text-sm font-medium text-surface-900">{election.totalCandidates || candidates.length}</dd>
                </div>
              </dl>
            </Card>

            <Card className="lg:col-span-2">
              <h3 className="mb-4 text-[15px] font-semibold text-surface-900">Description</h3>
              <p className="text-sm leading-relaxed text-surface-600">{election.description}</p>
            </Card>
          </div>
        )}

        {activeTab === 'positions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-surface-500">
                {(election.positions || []).length} position(s)
              </p>
              <Button size="sm" onClick={openAddPosition}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Position
              </Button>
            </div>

            {(election.positions || []).length === 0 ? (
              <EmptyState
                icon={Vote}
                title="No positions yet"
                description="Add positions to organize candidates in this election."
              />
            ) : (
              <Card className="!p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Candidates</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(election.positions || [])
                      .sort((a: Position, b: Position) => a.order - b.order)
                      .map((position: Position, index: number) => {
                        const positionCandidates = candidates.filter(
                          (c: any) => c.positionId === position.id
                        );
                        return (
                          <TableRow key={position.id}>
                            <TableCell className="text-surface-500">{index + 1}</TableCell>
                            <TableCell className="font-medium text-surface-900">
                              {position.title}
                            </TableCell>
                            <TableCell className="text-sm text-surface-600">
                              {position.description || '—'}
                            </TableCell>
                            <TableCell className="text-center text-surface-700">
                              {positionCandidates.length}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditPosition(position)}
                                >
                                  <Pencil className="h-4 w-4 text-surface-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletePositionId(position.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-danger-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'candidates' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-surface-500">
                {candidates.length} candidate(s)
              </p>
            </div>

            {candidates.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No candidates yet"
                description="Add candidates when creating or editing the election."
              />
            ) : (
              <Card className="!p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Votes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((c: any) => {
                      const position = (election.positions || []).find(
                        (p: Position) => p.id === c.positionId
                      );
                      return (
                        <TableRow key={c.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-surface-900">{c.name}</p>
                              {c.department && (
                                <p className="text-xs text-surface-500">{c.department}{c.year ? ` - ${c.year}` : ''}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-surface-600">{position?.title ?? 'N/A'}</TableCell>
                          <TableCell>{c.party ?? 'Independent'}</TableCell>
                          <TableCell>
                            <StatusBadge status={c.status} />
                          </TableCell>
                          <TableCell className="text-center">{c.votesReceived || 0}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteCandidateId(c.id)}
                            >
                              <Trash2 className="h-4 w-4 text-danger-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
        isOpen={deletePositionId !== null}
        onClose={() => setDeletePositionId(null)}
        onConfirm={() => deletePositionId && handleDeletePosition(deletePositionId)}
        title="Delete Position"
        message="Are you sure you want to delete this position? This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
      />

      <Modal
        isOpen={showPositionModal}
        onClose={() => setShowPositionModal(false)}
        title={editPosition ? 'Edit Position' : 'Add Position'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Position Title"
            placeholder="e.g., President, Secretary, Treasurer"
            value={positionTitle}
            onChange={(e) => setPositionTitle(e.target.value)}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700">
              Description (optional)
            </label>
            <textarea
              className={cn(
                'block w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900',
                'placeholder:text-surface-400',
                'hover:border-surface-300',
                'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20',
                'min-h-[80px] resize-y'
              )}
              placeholder="Describe the role..."
              value={positionDescription}
              onChange={(e) => setPositionDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button variant="outline" type="button" onClick={() => setShowPositionModal(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSavePosition}>
              {editPosition ? 'Save Changes' : 'Add Position'}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
