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
    <Card hover className="flex flex-col justify-between">
      <div>
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {election.title}
          </h3>
          <Badge variant={typeBadgeVariant[election.type as ElectionType]}>
            {election.type}
          </Badge>
        </div>
        <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
          {election.organization}
        </p>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {truncate(election.description, 120)}
        </p>
        <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(election.startDate)} - {formatDate(election.endDate)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {election.totalCandidates} candidates
          </span>
        </div>
        <StatusBadge status={election.status} />
      </div>
      <div className="mt-4">
        <Link to={`/elections/${election.id}`}>
          <Button variant="outline" size="sm" className="w-full">
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Elections</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search elections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 sm:w-72"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs tabs={filterTabs} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as FilterTab)} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
