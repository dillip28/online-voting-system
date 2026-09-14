import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
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
import { mockElections } from '@/mocks/elections';
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
  const [elections, setElections] = useState(mockElections);

  const filtered = useMemo(() => {
    return elections.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.organization.toLowerCase().includes(search.toLowerCase());
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
    setElections((prev) => prev.filter((e) => e.id !== id));
    setDeleteTarget(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Elections</h1>
            <p className="mt-1 text-sm text-gray-500">
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

        {paginated.length === 0 ? (
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
            <Card className="!p-0">
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
                          <p className="font-medium text-gray-900">{election.title}</p>
                          <p className="text-xs text-gray-500">{election.organization}</p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{election.type}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(election.startDate)}</p>
                          <p className="text-gray-500">to {formatDate(election.endDate)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={election.status as ElectionStatus} />
                      </TableCell>
                      <TableCell className="text-center">{election.totalCandidates}</TableCell>
                      <TableCell className="text-center">{election.votesCast.toLocaleString()}</TableCell>
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
              <p className="text-sm text-gray-500">
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

function Vote(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 12 2 2 4-4" />
      <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z" />
      <path d="M22 19H2" />
    </svg>
  );
}
