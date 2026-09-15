import { useState, useMemo, useEffect } from 'react';
import { Search, Download, ClipboardList } from 'lucide-react';
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
import { useToast } from '@/components/ui/toast';
import { apiClient } from '@/api/client';
import AdminLayout from '@/layouts/admin-layout';

const ITEMS_PER_PAGE = 8;

const actionOptions = [
  { value: '', label: 'All Actions' },
  { value: 'election.create', label: 'Election Create' },
  { value: 'election.update', label: 'Election Update' },
  { value: 'election.start', label: 'Election Start' },
  { value: 'candidate.approve', label: 'Candidate Approve' },
  { value: 'vote.submit', label: 'Vote Submit' },
  { value: 'results.publish', label: 'Results Publish' },
  { value: 'user.login', label: 'User Login' },
  { value: 'settings.update', label: 'Settings Update' },
];

const actionVariantMap: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  'election.create': 'success',
  'election.update': 'info',
  'election.start': 'success',
  'candidate.approve': 'success',
  'candidate.reject': 'danger',
  'vote.submit': 'info',
  'results.publish': 'success',
  'user.login': 'default',
  'settings.update': 'warning',
};

export default function AuditLogsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await apiClient.get<{ success: boolean; data: { items: any[] } }>('/admin/audit-logs', { params: { limit: 100 } });
        setLogs(res.data?.items || []);
      } catch { setLogs([]); }
      finally { setIsLoading(false); }
    };
    fetchLogs();
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
  }, [search, actionFilter, startDate, endDate]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleExport = () => {
    toast('info', 'Audit log export will be available soon.');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-primary-700">Audit Logs</h1>
            <p className="mt-1 text-[14px] text-surface-500">
              Track all system activities and changes.
            </p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
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

        {paginated.length === 0 ? (
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
                    <TableHead className="text-right">IP Address</TableHead>
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
                          {log.action}
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
                      <TableCell className="text-right font-mono text-[14px] text-surface-500">
                        {log.ipAddress ?? 'N/A'}
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
