import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Card, Badge, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { votesApi } from '@/api/votes';
import DashboardLayout from '@/layouts/dashboard-layout';

interface VoteHistoryItem {
  id: string;
  electionId: string;
  electionTitle: string;
  confirmationId: string;
  status: string;
  votedAt: string;
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  submitted: 'success',
  verified: 'success',
  invalid: 'danger',
};

export default function VoteHistoryPage() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [votes, setVotes] = useState<VoteHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await votesApi.getVotingHistory();
        if (res.data?.items) {
          setVotes(res.data.items.map((v: any, i: number) => ({
            id: `vh_${i}`,
            electionId: v.electionId,
            electionTitle: v.electionTitle,
            confirmationId: `CONFIRM-${v.electionId?.slice(0, 8)?.toUpperCase() || 'N/A'}`,
            status: v.status || 'submitted',
            votedAt: v.votedAt,
          })));
        }
      } catch {
        setVotes([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-bold text-primary-700">Vote History</h1>
          <p className="mt-1 text-[14px] text-surface-500">
            A record of all your past votes
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : votes.length === 0 ? (
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
          <Card className="border border-surface-200 rounded-lg bg-white p-0 overflow-hidden">
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
                {votes.map((item) => (
                  <TableRow key={item.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() =>
                        setExpandedRow(expandedRow === item.id ? null : item.id)
                      }
                    >
                      <TableCell>
                        <div>
                          <p className="text-[14px] font-medium text-primary-700">
                            {item.electionTitle}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-surface-600">
                        {formatDate(item.votedAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[item.status] || 'success'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-[13px] text-surface-600">
                          {item.confirmationId}
                        </span>
                      </TableCell>
                      <TableCell>
                        {expandedRow === item.id ? (
                          <ChevronUp className="h-4 w-4 text-surface-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-surface-400" />
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedRow === item.id && (
                      <TableRow key={`${item.id}-expanded`}>
                        <TableCell colSpan={5} className="bg-surface-50">
                          <div className="space-y-2 py-2">
                            <p className="text-[13px] font-semibold text-primary-700">
                              Vote recorded
                            </p>
                            <Link
                              to={`/elections/${item.electionId}`}
                              className="inline-flex items-center gap-1 text-[13px] font-medium text-accent-600 hover:text-accent-700"
                            >
                              View Election
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
