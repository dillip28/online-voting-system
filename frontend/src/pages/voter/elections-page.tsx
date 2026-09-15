import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Users, ArrowRight } from 'lucide-react';
import { formatDate, truncate } from '@/lib/utils';
import { Button, Card, Badge, Input, StatusBadge, Tabs, EmptyState } from '@/components/ui';
import { SkeletonCard } from '@/components/ui';
import { useElectionStore } from '@/store/election-store';
import type { ElectionType } from '@/types';
import DashboardLayout from '@/layouts/dashboard-layout';

type FilterTab = 'all' | 'active' | 'scheduled' | 'closed';
type SortOption = 'newest' | 'oldest' | 'closing';

const filterTabs = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'scheduled', label: 'Upcoming' },
  { id: 'closed', label: 'Completed' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'closing', label: 'Closing Soon' },
];

const typeBadgeVariant: Record<ElectionType, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  presidential: 'danger',
  parliamentary: 'info',
  local: 'default',
  student: 'success',
  organizational: 'warning',
  custom: 'default',
};

function ElectionCard({ election }: { election: any }) {
  return (
    <Card className="border border-surface-200 rounded-lg bg-white flex flex-col justify-between">
      <div>
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-[15px] font-semibold text-primary-700 leading-snug">
            {election.title}
          </h3>
          <Badge variant={typeBadgeVariant[election.type as ElectionType]} className="text-xs">
            {election.type}
          </Badge>
        </div>
        <p className="mb-2 text-[13px] font-medium text-surface-600">
          {election.organization}
        </p>
        <p className="mb-4 text-[13px] text-surface-500 leading-relaxed">
          {truncate(election.description, 120)}
        </p>
        <div className="mb-3 flex flex-wrap items-center gap-4 text-[13px] text-surface-600">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-surface-400" />
            {formatDate(election.startDate)} — {formatDate(election.endDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-surface-400" />
            {election.totalCandidates} candidates
          </span>
        </div>
        <StatusBadge status={election.status} />
      </div>
      <div className="mt-4">
        <Link to={`/elections/${election.id}`}>
          <Button variant="outline" size="sm" className="w-full border-surface-200 text-primary-600 hover:bg-primary-50 rounded-md">
            View Details
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default function ElectionsPage() {
  const { elections, isLoading, fetchElections } = useElectionStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  const filteredElections = useMemo(() => {
    let result = [...elections];

    if (activeTab !== 'all') {
      if (activeTab === 'closed') {
        result = result.filter((e) => e.status === 'closed' || e.status === 'results_published');
      } else {
        result = result.filter((e) => e.status === activeTab);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.organization.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'closing':
        result.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
        break;
    }

    return result;
  }, [elections, activeTab, sortBy, searchQuery]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-[22px] font-bold text-primary-700">Elections</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <Input
              placeholder="Search elections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 sm:w-72 border-surface-200 rounded-md text-[14px]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs tabs={filterTabs} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as FilterTab)} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-md border border-surface-200 bg-white px-3 py-2 text-[13px] text-surface-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredElections.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No elections found"
            description={
              searchQuery
                ? `No elections match "${searchQuery}"`
                : 'There are no elections in this category.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredElections.map((election) => (
              <ElectionCard key={election.id} election={election} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
