import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/components/ui/toast';
import { candidatesApi } from '@/api/candidates';
import { electionsApi } from '@/api/elections';
import type { Candidate, CandidateStatus } from '@/types';
import AdminLayout from '@/layouts/admin-layout';

const ITEMS_PER_PAGE = 8;

const statusFilterOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

interface CandidateForm {
  name: string;
  electionId: string;
  positionId: string;
  party: string;
  biography: string;
  manifesto: string;
}

const emptyForm: CandidateForm = {
  name: '',
  electionId: '',
  positionId: '',
  party: '',
  biography: '',
  manifesto: '',
};

export default function CandidatesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [electionFilter, setElectionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [electionList, setElectionList] = useState<any[]>([]);
  const [positionList, setPositionList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCandidate, setEditCandidate] = useState<Candidate | null>(null);
  const [form, setForm] = useState<CandidateForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [candRes, elecRes] = await Promise.all([
          candidatesApi.getCandidates(),
          electionsApi.getElections({ limit: 100 }),
        ]);
        setCandidates(candRes.data?.items || candRes.data || []);
        setElectionList(elecRes.data?.items || []);
      } catch { /* ignore */ }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  const electionOptions = [
    { value: '', label: 'All Elections' },
    ...electionList.map((e) => ({ value: e.id, label: e.title })),
  ];

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.party?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesStatus = !statusFilter || c.status === statusFilter;
      const matchesElection = !electionFilter || c.electionId === electionFilter;
      return matchesSearch && matchesStatus && matchesElection;
    });
  }, [candidates, search, statusFilter, electionFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const openCreateModal = () => {
    setEditCandidate(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  useEffect(() => {
    if (!form.electionId) {
      setPositionList([]);
      return;
    }

    electionsApi.getElection(form.electionId)
      .then((response) => setPositionList(response.data?.positions || []))
      .catch(() => setPositionList([]));
  }, [form.electionId]);

  const openEditModal = (candidate: Candidate) => {
    setEditCandidate(candidate);
    setForm({
      name: candidate.name,
      electionId: candidate.electionId,
      positionId: candidate.positionId,
      party: candidate.party ?? '',
      biography: candidate.biography,
      manifesto: candidate.manifesto,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.electionId || !form.positionId) {
      toast('error', 'Name, election, and position are required.');
      return;
    }

    try {
      if (editCandidate) {
        await candidatesApi.updateCandidate(editCandidate.id, {
          name: form.name,
          electionId: form.electionId,
          positionId: form.positionId,
          party: form.party || undefined,
          biography: form.biography,
          manifesto: form.manifesto,
        });
        toast('success', `${form.name} has been updated.`);
      } else {
        await candidatesApi.createCandidate({
          name: form.name,
          electionId: form.electionId,
          positionId: form.positionId,
          party: form.party || undefined,
          biography: form.biography,
          manifesto: form.manifesto,
        });
        toast('success', `${form.name} has been added.`);
      }

      const candRes = await candidatesApi.getCandidates();
      setCandidates(Array.isArray(candRes.data) ? candRes.data : []);
    } catch {
      toast('error', 'Something went wrong. Please try again.');
    }

    setShowModal(false);
    setForm(emptyForm);
    setEditCandidate(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await candidatesApi.deleteCandidate(id);
      setCandidates((prev) => prev.filter((c) => c.id !== id));
      toast('success', 'The candidate has been removed.');
    } catch {
      toast('error', 'Failed to delete candidate.');
    }
    setDeleteTarget(null);
  };

  const handleStatusChange = async (id: string, status: CandidateStatus) => {
    try {
      await candidatesApi.updateCandidate(id, { status });
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
      toast('success', `Candidate has been ${status}.`);
    } catch {
      toast('error', 'Failed to update candidate status.');
    }
  };

  const updateField = <K extends keyof CandidateForm>(key: K, value: CandidateForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-primary-700">Candidates</h1>
            <p className="mt-1 text-[14px] text-surface-500">
              Manage candidates across all elections.
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Add Candidate
          </Button>
        </div>

        <Card className="!p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Input
                placeholder="Search candidates..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                icon={Search}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={electionOptions}
                value={electionFilter}
                onChange={(e) => {
                  setElectionFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                options={statusFilterOptions}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </Card>

        {paginated.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No candidates found"
            description="Try adjusting your search or filter criteria."
            action={{ children: 'Add Candidate', onClick: openCreateModal }}
          />
        ) : (
          <>
            <Card className="!p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Election</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Votes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((candidate) => {
                    const election = electionList.find((e) => e.id === candidate.electionId);
                    return (
                      <TableRow key={candidate.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-surface-800">{candidate.name}</p>
                            <p className="text-xs text-surface-400">{candidate.position?.title ?? 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-[14px] text-surface-600">
                          {election?.title ?? 'Unknown'}
                        </TableCell>
                        <TableCell className="text-[14px] text-surface-600">{candidate.party ?? 'Independent'}</TableCell>
                        <TableCell>
                          <StatusBadge status={candidate.status} />
                        </TableCell>
                        <TableCell className="text-center text-[14px] text-surface-700">{candidate.votesReceived}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {candidate.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStatusChange(candidate.id, 'approved')}
                                >
                                  <CheckCircle2 className="h-4 w-4 text-success-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStatusChange(candidate.id, 'rejected')}
                                >
                                  <XCircle className="h-4 w-4 text-danger-500" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(candidate)}
                            >
                              <Pencil className="h-4 w-4 text-surface-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(candidate.id)}
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

            <div className="flex items-center justify-between">
              <p className="text-[14px] text-surface-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}{' '}
                candidates
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editCandidate ? 'Edit Candidate' : 'Add Candidate'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="Candidate name"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
          <Select
            label="Election"
            options={electionList.map((e) => ({ value: e.id, label: e.title }))}
            placeholder="Select election"
            value={form.electionId}
            onChange={(e) => {
              updateField('electionId', e.target.value);
              updateField('positionId', '');
            }}
          />
          <Select
            label="Position"
            options={positionList.map((position) => ({ value: position.id, label: position.title }))}
            placeholder={form.electionId ? 'Select position' : 'Select an election first'}
            value={form.positionId}
            onChange={(e) => updateField('positionId', e.target.value)}
            disabled={!form.electionId || positionList.length === 0}
          />
          <Input
            label="Party"
            placeholder="Party name (optional)"
            value={form.party}
            onChange={(e) => updateField('party', e.target.value)}
          />
          <div>
            <label className="mb-1 block text-[14px] font-medium text-surface-700">Biography</label>
            <textarea
              className={cn(
                'block w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-[14px] text-surface-800',
                'placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
                'min-h-[80px] resize-y'
              )}
              placeholder="Brief biography..."
              value={form.biography}
              onChange={(e) => updateField('biography', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-[14px] font-medium text-surface-700">Manifesto</label>
            <textarea
              className={cn(
                'block w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-[14px] text-surface-800',
                'placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
                'min-h-[80px] resize-y'
              )}
              placeholder="Election manifesto..."
              value={form.manifesto}
              onChange={(e) => updateField('manifesto', e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editCandidate ? 'Save Changes' : 'Add Candidate'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="Delete Candidate"
        message="Are you sure you want to delete this candidate? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </AdminLayout>
  );
}
