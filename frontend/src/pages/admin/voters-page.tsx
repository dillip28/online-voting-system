import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Users,
  Download,
  Upload,
  Eye,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/components/ui/toast';
import { mockUsers } from '@/mocks/users';
import type { User } from '@/types';
import AdminLayout from '@/layouts/admin-layout';

const ITEMS_PER_PAGE = 8;

const statusFilterOptions = [
  { value: '', label: 'All Voters' },
  { value: 'verified', label: 'Verified' },
  { value: 'unverified', label: 'Unverified' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function VotersPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [voters, setVoters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewVoter, setViewVoter] = useState<User | null>(null);
  const [toggleTarget, setToggleTarget] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVoters(mockUsers);
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    return voters.filter((v) => {
      const matchesSearch =
        v.fullName.toLowerCase().includes(search.toLowerCase()) ||
        v.email.toLowerCase().includes(search.toLowerCase()) ||
        (v.studentId?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'verified' && v.isVerified) ||
        (statusFilter === 'unverified' && !v.isVerified) ||
        (statusFilter === 'active' && v.isActive) ||
        (statusFilter === 'inactive' && !v.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [voters, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleToggleActive = (id: string) => {
    setVoters((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isVerified: !v.isVerified } : v))
    );
    toast('success', 'Voter account status has been toggled.');
    setToggleTarget(null);
  };

  const handleImport = () => {
    toast('info', 'CSV import feature will be available soon.');
  };

  const handleExport = () => {
    toast('info', 'Voter export feature will be available soon.');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-primary-700">Voters</h1>
            <p className="mt-1 text-[14px] text-surface-500">
              Manage registered voters and their account status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleImport}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Card className="!p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Input
                placeholder="Search voters..."
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

        <div className="flex items-center justify-between">
          <p className="text-[14px] text-surface-500">
            {filtered.length} voter(s) found
          </p>
        </div>

        {paginated.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No voters found"
            description="Try adjusting your search or filter criteria."
          />
        ) : (
          <>
            <Card className="!p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Account Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((voter) => (
                    <TableRow key={voter.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-600 border border-primary-100">
                            {voter.avatar ? (
                              <img src={voter.avatar} alt="" className="h-8 w-8 rounded-full" />
                            ) : (
                              voter.fullName
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                            )}
                          </div>
                          <span className="font-medium text-surface-800">{voter.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-surface-500 text-[14px]">{voter.email}</TableCell>
                      <TableCell className="text-[14px] text-surface-600">{voter.studentId ?? 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={voter.isVerified ? 'success' : 'warning'}>
                          {voter.isVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={voter.isActive ? 'success' : 'danger'}>
                          {voter.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewVoter(voter)}
                          >
                            <Eye className="h-4 w-4 text-surface-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setToggleTarget(voter.id)}
                          >
                            {voter.isActive ? (
                              <UserX className="h-4 w-4 text-danger-500" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-success-500" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <div className="flex items-center justify-between">
              <p className="text-[14px] text-surface-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}{' '}
                voters
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
        isOpen={viewVoter !== null}
        onClose={() => setViewVoter(null)}
        title="Voter Details"
        size="md"
      >
        {viewVoter && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-lg font-semibold text-primary-600 border border-primary-100">
                {viewVoter.avatar ? (
                  <img src={viewVoter.avatar} alt="" className="h-14 w-14 rounded-full" />
                ) : (
                  viewVoter.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                )}
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-surface-800">{viewVoter.fullName}</h3>
                <p className="text-[14px] text-surface-500">{viewVoter.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-surface-100 pt-4">
              <div>
                <p className="text-[13px] text-surface-400">Phone</p>
                <p className="text-[14px] font-medium text-surface-700">{viewVoter.phone ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-[13px] text-surface-400">Student ID</p>
                <p className="text-[14px] font-medium text-surface-700">{viewVoter.studentId ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-[13px] text-surface-400">Verification</p>
                <Badge variant={viewVoter.isVerified ? 'success' : 'warning'}>
                  {viewVoter.isVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
              <div>
                <p className="text-[13px] text-surface-400">Account Status</p>
                <Badge variant={viewVoter.isActive ? 'success' : 'danger'}>
                  {viewVoter.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div>
                <p className="text-[13px] text-surface-400">2FA Enabled</p>
                <p className="text-[14px] font-medium text-surface-700">
                  {viewVoter.twoFactorEnabled ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-[13px] text-surface-400">Joined</p>
                <p className="text-[14px] font-medium text-surface-700">
                  {new Date(viewVoter.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmationDialog
        isOpen={toggleTarget !== null}
        onClose={() => setToggleTarget(null)}
        onConfirm={() => toggleTarget && handleToggleActive(toggleTarget)}
        title="Toggle Account Status"
        message="Are you sure you want to toggle this voter's account status?"
        confirmLabel="Confirm"
        confirmVariant="primary"
      />
    </AdminLayout>
  );
}
