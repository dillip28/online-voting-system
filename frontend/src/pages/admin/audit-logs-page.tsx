import { useState, useMemo, useEffect } from 'react';
import { Search, ClipboardList } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import * as auditStorage from '@/services/auditStorage';
import AdminLayout from '@/layouts/admin-layout';

const ITEMS_PER_PAGE = 10;

const actionOptions = [
  { value: '', label: 'All Actions' },
  { value: 'election.create', label: 'Election Created' },
  { value: 'election.schedule', label: 'Election Scheduled' },
  { value: 'election.activate', label: 'Election Activated' },
  { value: 'election.close', label: 'Election Closed' },
  { value: 'election.publish', label: 'Results Published' },
  { value: 'election.update', label: 'Election Updated' },
  { value: 'position.create', label: 'Position Created' },
  { value: 'candidate.approve', label: 'Candidate Approved' },
  { value: 'candidate.reject', label: 'Candidate Rejected' },
  { value: 'voter.create', label: 'Voter Added' },
  { value: 'vote.submit', label: 'Vote Submitted' },
  { value: 'user.login', label: 'User Login' },
  { value: 'settings.update', label: 'Settings Updated' },
];

const actionVariantMap: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  'election.create': 'success',
  'election.schedule': 'info',
  'election.activate': 'success',
  'election.close': 'warning',
  'election.publish': 'success',
  'election.update': 'info',
  'position.create': 'info',
  'candidate.approve': 'success',
  'candidate.reject': 'danger',
  'voter.create': 'success',
  'vote.submit': 'info',
  'user.login': 'default',
  'settings.update': 'warning',
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const result = auditStorage.getAuditLogs({ limit: 500 });
      setLogs(result.items);
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.userName.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.resource.toLowerCase().includes(search.toLowerCase()) ||
        (log.details?.toLowerCase().includes(search.toLowerCase()) ?? false);

      const matchesAction = !actionFilter || log.action === actionFilter;

      const logDate = new Date(log.createdAt);
      const matchesStart = !startDate || logDate >= new Date(startDate);
      const matchesEnd = !endDate || logDate <= new Date(endDate + 'T23:59:59');

      return matchesSearch && matchesAction && matchesStart && matchesEnd;
    });
  }, [search, actionFilter, startDate, endDate, logs]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-semibold text-primary-700">Audit Logs</h1>
          <p className="mt-1 text-[14px] text-surface-500">
            Track all system activities and changes.
          </p>
        </div>

        <Card className="!p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                icon={Search}
              />
            </div>
            <div>
              <Select
                options={actionOptions}
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="Start date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <Input
                type="date"
                placeholder="End date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-[14px] text-surface-500">
            {filtered.length} log(s) found
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-surface-200 border-t-primary-600" />
            <span className="ml-3 text-sm text-surface-500">Loading logs...</span>
          </div>
        ) : paginated.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No audit logs found"
            description="Try adjusting your search or filter criteria."
          />
        ) : (
          <>
            <Card className="!p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <span className="text-[14px] text-surface-500">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-surface-800">{log.userName}</p>
                          <p className="text-xs capitalize text-surface-400">
                            {log.userRole.replace('_', ' ')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionVariantMap[log.action] ?? 'default'}>
                          {log.action.replace('.', ' ').replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize text-surface-600 text-[14px]">
                        {log.resource}
                      </TableCell>
                      <TableCell>
                        <p className="max-w-xs truncate text-[14px] text-surface-500">
                          {log.details ?? '-'}
                        </p>
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
                logs
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
    </AdminLayout>
  );
}
