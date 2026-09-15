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
import { mockElections } from '@/mocks/elections';
import { mockResults } from '@/mocks/results';
import type { Result } from '@/types';
import AdminLayout from '@/layouts/admin-layout';

const PIE_COLORS = ['#123B5D', '#167D72', '#D97706', '#DC2626', '#5380AF', '#1DA597'];

export default function ResultsPage() {
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const electionOptions = mockElections
    .filter((e) => ['closed', 'results_published'].includes(e.status) || e.votesCast > 0)
    .map((e) => ({ value: e.id, label: e.title }));

  useEffect(() => {
    if (!selectedElectionId) {
      setResult(null);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      const found = mockResults.find((r) => r.electionId === selectedElectionId) ?? null;
      setResult(found);
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [selectedElectionId]);

  const election = mockElections.find((e) => e.id === selectedElectionId);

  const overallStats = election
    ? {
        totalEligible: election.eligibleVoters,
        votesCast: election.votesCast,
        turnout:
          election.eligibleVoters > 0
            ? ((election.votesCast / election.eligibleVoters) * 100).toFixed(1)
            : '0',
        invalidVotes: Math.floor(election.votesCast * 0.02),
      }
    : null;

  const chartData =
    result?.candidates.map((c) => ({
      name: c.name.length > 15 ? c.name.slice(0, 15) + '...' : c.name,
      votes: c.votes,
    })) ?? [];

  const pieData =
    result?.candidates.map((c) => ({
      name: c.name,
      value: c.votes,
    })) ?? [];

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
            options={electionOptions}
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
        ) : isLoading ? (
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <Card>
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-danger-50 p-3 border border-danger-500/20">
                      <Trophy className="h-5 w-5 text-danger-500" />
                    </div>
                    <div>
                      <p className="text-[13px] text-surface-400">Invalid Votes</p>
                      <p className="text-[22px] font-semibold text-surface-800">
                        {overallStats.invalidVotes.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

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

            <Card>
              <h3 className="mb-4 text-[16px] font-semibold text-surface-800">Candidate Results</h3>
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
                  {result.candidates
                    .sort((a, b) => a.rank - b.rank)
                    .map((c) => (
                      <TableRow key={c.candidateId}>
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
                        <TableCell className="text-surface-500 text-[14px]">{c.party ?? 'Independent'}</TableCell>
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
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
