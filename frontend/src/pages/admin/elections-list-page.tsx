import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2, Vote, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
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
import * as storage from '@/services/electionStorage';
import type { ElectionStatus } from '@/types';
import AdminLayout from '@/layouts/admin-layout';

const ITEMS_PER_PAGE = 5;

const statusFilterOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
  { value: 'results_published', label: 'Published' },
];

export default function ElectionsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [elections, setElections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      const result = storage.getElections({ limit: 100 });
      setElections(result.items);
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    return elections.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.organization?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesStatus = !statusFilter || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [elections, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDelete = (id: string) => {
    storage.deleteElection(id);
    setElections((prev) => prev.filter((e) => e.id !== id));
    toast('success', 'Election deleted successfully.');
    setDeleteTarget(null);
  };

  const handlePublishToggle = (id: string, currentStatus: string) => {
    if (currentStatus === 'draft') {
      storage.scheduleElection(id);
      toast('success', 'Election has been published.');
    } else if (currentStatus === 'scheduled') {
      storage.unpublishElection(id);
      toast('success', 'Election has been unpublished.');
    }
    const result = storage.getElections({ limit: 100 });
    setElections(result.items);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-surface-900">Elections</h1>
            <p className="mt-1 text-sm text-surface-500">
              Manage all elections in the system.
            </p>
          </div>
          <Button onClick={() => navigate('/admin/elections/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Election
          </Button>
        </div>

        <Card className="!p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Input
                placeholder="Search elections..."
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

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-surface-400" />
            <span className="ml-3 text-sm text-surface-500">Loading elections...</span>
          </div>
        ) : paginated.length === 0 ? (
          <EmptyState
            icon={Vote}
            title="No elections found"
            description="Try adjusting your search or filter criteria."
            action={{
              children: 'Create Election',
              onClick: () => navigate('/admin/elections/create'),
            }}
          />
        ) : (
          <>
            <Card className="!p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Candidates</TableHead>
                    <TableHead className="text-center">Votes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((election) => (
                    <TableRow key={election.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-surface-900">{election.title}</p>
                          <p className="text-xs text-surface-500">{election.organization}</p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{election.type}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="text-surface-700">{formatDate(election.startDate)}</p>
                          <p className="text-surface-400">to {formatDate(election.endDate)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={election.status as ElectionStatus} />
                      </TableCell>
                      <TableCell className="text-center">{election.totalCandidates ?? 0}</TableCell>
                      <TableCell className="text-center">{(election.votesCast ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/elections/${election.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/elections/${election.id}/edit`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {(election.status === 'draft' || election.status === 'scheduled') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePublishToggle(election.id, election.status)}
                              title={election.status === 'draft' ? 'Publish' : 'Unpublish'}
                            >
                              <Vote className="h-4 w-4 text-accent-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(election.id)}
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

            <div className="flex items-center justify-between">
              <p className="text-sm text-surface-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}{' '}
                elections
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

      <ConfirmationDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="Delete Election"
        message="Are you sure you want to delete this election? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    </AdminLayout>
  );
}
