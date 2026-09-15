import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart3, Trophy, Users, Vote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { apiClient } from '@/api/client';
import type { Result } from '@/types';
import AdminLayout from '@/layouts/admin-layout';

const PIE_COLORS = ['#123B5D', '#167D72', '#D97706', '#DC2626', '#5380AF', '#1DA597'];

interface ElectionOption {
  id: string;
  title: string;
  status: string;
  totalVotes: number;
  eligibleVoters: number;
}

interface ElectionResultResponse {
  electionId: string;
  electionTitle: string;
  electionStatus: string;
  totalEligibleVoters: number;
  totalVotesCast: number;
  turnoutPercentage: number;
  positions: {
    positionId: string;
    positionTitle: string;
    positionDescription: string | null;
    candidates: {
      candidateId: string | null;
      name: string;
      photoUrl: string | null;
      party: string | null;
      votes: number;
      percentage: number;
      rank: number;
      isWinner: boolean;
    }[];
    totalVotes: number;
    notaVotes: number;
  }[];
}

export default function ResultsPage() {
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingElections, setIsLoadingElections] = useState(true);
  const [electionOptions, setElectionOptions] = useState<ElectionOption[]>([]);
  const [result, setResult] = useState<ElectionResultResponse | null>(null);

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const res = await apiClient.get<{ success: boolean; data: { items: ElectionOption[] } }>('/admin/elections-with-results');
        setElectionOptions(res.data?.items || []);
      } catch {
        setElectionOptions([]);
      } finally {
        setIsLoadingElections(false);
      }
    };
    fetchElections();
  }, []);

  useEffect(() => {
    if (!selectedElectionId) {
      setResult(null);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<{ success: boolean; data: ElectionResultResponse }>(`/elections/${selectedElectionId}/results`);
        setResult(res.data || null);
      } catch {
        setResult(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [selectedElectionId]);

  const selectedElection = electionOptions.find((e) => e.id === selectedElectionId);

  const overallStats = selectedElection
    ? {
        totalEligible: result?.totalEligibleVoters || selectedElection.eligibleVoters || 0,
        votesCast: result?.totalVotesCast || selectedElection.totalVotes || 0,
        turnout: result?.turnoutPercentage?.toFixed(1) || '0',
      }
    : null;

  // Flatten all candidates across positions for charts
  const allCandidates =
    result?.positions.flatMap((p) =>
      p.candidates.filter((c) => c.candidateId !== null)
    ) ?? [];

  const chartData = allCandidates.map((c) => ({
    name: c.name.length > 15 ? c.name.slice(0, 15) + '...' : c.name,
    votes: c.votes,
  }));

  const pieData = allCandidates.map((c) => ({
    name: c.name,
    value: c.votes,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-semibold text-primary-700">Results Dashboard</h1>
          <p className="mt-1 text-[14px] text-surface-500">
            View election results and analyze voting patterns.
          </p>
        </div>

        <Card className="!p-4">
          <Select
            label="Select Election"
            options={electionOptions.map((e) => ({
              value: e.id,
              label: `${e.title} (${e.status === 'results_published' ? 'Published' : e.status === 'closed' ? 'Closed' : 'Counting'})`,
            }))}
            placeholder="Choose an election to view results"
            value={selectedElectionId}
            onChange={(e) => setSelectedElectionId(e.target.value)}
          />
        </Card>

        {!selectedElectionId ? (
          <EmptyState
            icon={BarChart3}
            title="No election selected"
            description="Select an election from the dropdown above to view its results."
          />
        ) : isLoading || isLoadingElections ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : !result ? (
          <EmptyState
            icon={BarChart3}
            title="No results available"
            description="Results for this election have not been published yet."
          />
        ) : (
          <div className="space-y-6">
            {overallStats && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary-50 p-3 border border-primary-100">
                      <Users className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-[13px] text-surface-400">Total Eligible</p>
                      <p className="text-[22px] font-semibold text-surface-800">
                        {overallStats.totalEligible.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-success-50 p-3 border border-success-500/20">
                      <Vote className="h-5 w-5 text-success-600" />
                    </div>
                    <div>
                      <p className="text-[13px] text-surface-400">Votes Cast</p>
                      <p className="text-[22px] font-semibold text-surface-800">
                        {overallStats.votesCast.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-info-50 p-3 border border-info-500/20">
                      <BarChart3 className="h-5 w-5 text-info-600" />
                    </div>
                    <div>
                      <p className="text-[13px] text-surface-400">Turnout</p>
                      <p className="text-[22px] font-semibold text-surface-800">{overallStats.turnout}%</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {allCandidates.length > 0 && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <h3 className="mb-4 text-[16px] font-semibold text-surface-800">Candidate Votes</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#D9E0E7" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#667085' }} />
                        <YAxis tick={{ fontSize: 12, fill: '#667085' }} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid #D9E0E7',
                            fontSize: '14px',
                          }}
                        />
                        <Bar dataKey="votes" fill="#123B5D" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <h3 className="mb-4 text-[16px] font-semibold text-surface-800">Vote Distribution</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                        >
                          {pieData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            )}

            {result.positions.map((position) => (
              <Card key={position.positionId}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[16px] font-semibold text-surface-800">
                    {position.positionTitle}
                  </h3>
                  <span className="text-[13px] text-surface-400">
                    {position.totalVotes} total vote{position.totalVotes !== 1 ? 's' : ''}
                  </span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead className="text-right">Votes</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {position.candidates
                      .sort((a, b) => a.rank - b.rank)
                      .map((c) => (
                        <TableRow key={c.candidateId || 'nota'}>
                          <TableCell>
                            <span
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold',
                                c.rank === 1
                                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                                  : c.rank === 2
                                  ? 'bg-surface-100 text-surface-600 border border-surface-200'
                                  : c.rank === 3
                                  ? 'bg-warning-50 text-warning-700 border border-warning-500/20'
                                  : 'bg-surface-50 text-surface-500 border border-surface-200'
                              )}
                            >
                              {c.rank}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-surface-800">{c.name}</TableCell>
                          <TableCell className="text-surface-500 text-[14px]">{c.party ?? (c.candidateId === null ? 'NOTA' : 'Independent')}</TableCell>
                          <TableCell className="text-right font-medium text-surface-700">
                            {c.votes.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-[14px] text-surface-600">{c.percentage.toFixed(1)}%</TableCell>
                          <TableCell className="text-center">
                            {c.isWinner && (
                              <Badge variant="success">
                                <Trophy className="mr-1 inline h-3 w-3" />
                                Winner
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
