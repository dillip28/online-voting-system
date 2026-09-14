import { useState } from 'react';
import { Link } from 'react-router-dom';
import { History, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Card, Badge, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import type { VoteStatus, ElectionType } from '@/types';
import DashboardLayout from '@/layouts/dashboard-layout';

interface VoteHistoryItem {
  id: string;
  electionId: string;
  electionTitle: string;
  electionType: ElectionType;
  confirmationId: string;
  status: VoteStatus;
  submittedAt: string;
  positions: { name: string; candidate: string }[];
}

const mockVoteHistory: VoteHistoryItem[] = [
  {
    id: 'vh_001',
    electionId: 'elec_002',
    electionTitle: 'Department Head Election',
    electionType: 'organizational',
    confirmationId: 'VOTE-DH-7890',
    status: 'submitted',
    submittedAt: '2026-09-15T14:30:00Z',
    positions: [{ name: 'Department Head', candidate: 'Dr. Robert Chang' }],
  },
  {
    id: 'vh_002',
    electionId: 'elec_005',
    electionTitle: 'Best Student Award 2025',
    electionType: 'student',
    confirmationId: 'VOTE-BS-4521',
    status: 'submitted',
    submittedAt: '2025-12-05T09:15:00Z',
    positions: [{ name: 'Best Student', candidate: 'Laura Bennett' }],
  },
];

const statusVariant: Record<VoteStatus, 'default' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  submitted: 'success',
  verified: 'success',
  invalid: 'danger',
};

export default function VoteHistoryPage() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vote History</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            A record of all your past votes
          </p>
        </div>

        {mockVoteHistory.length === 0 ? (
          <EmptyState
            icon={History}
            title="No votes yet"
            description="You haven't cast any votes yet. Browse elections to get started."
            action={{
              children: 'Browse Elections',
              onClick: () => {},
            }}
          />
        ) : (
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Election</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confirmation ID</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockVoteHistory.map((item) => (
                  <>
                    <TableRow
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() =>
                        setExpandedRow(expandedRow === item.id ? null : item.id)
                      }
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.electionTitle}
                          </p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {item.electionType}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        {formatDate(item.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[item.status]}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
                          {item.confirmationId}
                        </span>
                      </TableCell>
                      <TableCell>
                        {expandedRow === item.id ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedRow === item.id && (
                      <TableRow key={`${item.id}-expanded`}>
                        <TableCell colSpan={5} className="bg-gray-50 dark:bg-gray-800/50">
                          <div className="space-y-2 py-2">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Votes cast:
                            </p>
                            {item.positions.map((pos, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <span>{pos.name}:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {pos.candidate}
                                </span>
                              </div>
                            ))}
                            <Link
                              to={`/elections/${item.electionId}`}
                              className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                            >
                              View Election
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
