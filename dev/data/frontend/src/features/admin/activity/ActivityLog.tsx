import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSocket } from '@/context';
import { FilterLayout } from '@shared';
import { DefaultAvatar } from '@/shared/ui/DefaultAvatar';
import { activityApi } from '@/features/admin/activity/api/activity.api';
import type { ActivityEvent, DateRangeFilter, CustomDateRange } from '@/features/admin/activity/types';
import { getDateRangeBounds, DATE_RANGE_OPTIONS } from '@/features/admin/activity/components';

// maps ui filter labels to match api event types
const TAB_TO_TYPE: Record<string, string> = {
  Presence: 'presence',
  Spaces: 'space',
  Tasks: 'task',
  Meetings: 'meeting',
};

const ActivityAvatar = ({ url, name }: { url?: string | null; name: string }) => {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return <DefaultAvatar name={name} className="w-11 h-11 flex-shrink-0" />;
  }

  return (
    <img
      src={url}
      alt={name}
      className="w-11 h-11 rounded-full object-cover flex-shrink-0"
      onError={() => setFailed(true)}
    />
  );
};

export function ActivityLog() {
  const [activeTab, setActiveTab] = useState<'All' | 'Presence' | 'Spaces' | 'Tasks' | 'Meetings'>('All');
  // searchInput updates instantly on every keystroke (keeps the field responsive).
  // searchQuery only updates after the user pauses typing, and is what actually
  // drives the API call / re-render of the list below.
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [customRange, setCustomRange] = useState<CustomDateRange>({ startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNewActivity, setHasNewActivity] = useState(false); 
  const { startDate, endDate } = useMemo(
	() => getDateRangeBounds(dateRange, customRange),
	[dateRange, customRange.startDate, customRange.endDate]
  );

  const { subscribeDashboard, unsubscribeDashboard, latestActivity, activitySeq } = useSocket();

  // debounce: only push searchInput > seachQuery after typing for 300ms
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, perPage, dateRange, customRange]);

  const fetchActivities = useCallback(() => {
    if (dateRange === 'custom' && (!customRange.startDate || !customRange.endDate)) return () => {};

    let cancelled = false;
    setIsLoading(true);

    activityApi
      .getAllActivities({ type: activeTab, search: searchQuery, page, limit: perPage, startDate, endDate })
      .then((res) => {
        if (cancelled) return;
        setActivities(res.data);
        setTotalItems(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
        setHasNewActivity(false);
      })
      .catch((err) => {
        console.error('Failed to fetch activities:', err);
        if (!cancelled) {
          setActivities([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, searchQuery, page, perPage, dateRange, customRange, startDate, endDate]);

  useEffect(() => {
    const cancel = fetchActivities();
    return cancel;
  }, [fetchActivities]);

  useEffect(() => {
    subscribeDashboard();
    return () => unsubscribeDashboard();
  }, [subscribeDashboard, unsubscribeDashboard]);

  // Handle real-time activity updates
  // If user is on page 1 with no filters, merge new activity directly
  useEffect(() => {
    if (activitySeq === 0 || !latestActivity) return;

    const tabMatches = activeTab === 'All' || TAB_TO_TYPE[activeTab] === latestActivity.type;
    const canMergeInPlace =
      page === 1 && !searchQuery && dateRange === 'all' && tabMatches;

    if (canMergeInPlace) {
      setActivities((prev) => [latestActivity, ...prev].slice(0, perPage));
      setTotalItems((prev) => prev + 1);
    } else if (tabMatches) {
      setHasNewActivity(true);
    }
	// only trigger on new socket events, silence filters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activitySeq]);

  const categoryStyles: Record<string, { dotColor: string; textColor: string }> = {
    presence: { dotColor: 'bg-accent-lime', textColor: 'text-accent-lime' },
    meeting:  { dotColor: 'bg-accent-gold', textColor: 'text-accent-gold' },
    task:     { dotColor: 'bg-accent-teal', textColor: 'text-accent-teal' },
    space:    { dotColor: 'bg-foreground', textColor: 'text-foreground' }
  };

  const filterTabs = [
    { label: 'All', value: 'All' },
    { label: 'Presence', value: 'Presence' },
    { label: 'Spaces', value: 'Spaces' },
    { label: 'Tasks', value: 'Tasks' },
    { label: 'Meetings', value: 'Meetings' },
  ];

  const handleFilterChange = (filter: string) => {
    setActiveTab(filter as typeof activeTab);
  };

  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + activities.length;

  return (
	<FilterLayout
	searchQuery={searchInput}
	onSearchChange={setSearchInput}
	searchPlaceholder="Search activities..."
	filterTabs={filterTabs}
	activeFilter={activeTab}
	onFilterChange={handleFilterChange}
	filterValue=""
	onFilterSelect={() => {}}
	filterOptions={[]}
	getFilterLabel={() => ''}
	showDropdown={false}
	showDateFilter={true}
	dateRangeValue={dateRange}
	dateRangeOptions={DATE_RANGE_OPTIONS}
	onDateRangeChange={(value) => setDateRange(value as DateRangeFilter)}
	customRange={customRange}
    onCustomRangeChange={setCustomRange}
	isLoading={isLoading}
	emptyMessage="No live activities stream discovered matching this view context."
	showPagination={true}
	totalItems={totalItems}
	currentPage={page}
	perPage={perPage}
	onPageChange={setPage}
	onPerPageChange={setPerPage}
	startIndex={startIndex}
	endIndex={endIndex}
	totalPages={totalPages}
	containerHeight="calc(103vh - 120px)"
	>
      {hasNewActivity && (
        <button
          onClick={fetchActivities}
          className="w-full text-center text-sm font-medium text-accent-lime bg-background-2 hover:bg-background rounded-lg py-2 mb-2 transition-colors"
        >
          New activity available — click to refresh
        </button>
      )}
      <div className="relative pl-4.5 space-y-2 pt-8 pb-8">
        <div className="absolute left-[19px] top-8 bottom-8 w-[1px] bg-background-4 pointer-events-none" />

        {activities.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-foreground-3">No live activities stream discovered matching this view context.</p>
          </div>
        ) : (
          activities.map((item) => {
            const styles = categoryStyles[item.type] || categoryStyles.space;
            const hasContext = item.contextTitle || item.contextDetails;

            return (
              <div key={item.id} className="relative flex items-stretch group">
                <div className="absolute top-1/2 -translate-y-1/2 flex items-center gap-12">
                  <div className={`w-4 h-4 rounded-full ring-4 ring-background z-10 flex-shrink-0 ${styles.dotColor}`} />
                  <span className="text-base font-medium text-foreground-1 w-20 text-left select-none">
                    {item.time}
                  </span>
                </div>

                <div className="flex-grow flex items-center justify-between ml-42 bg-background-2 rounded-xl px-5 py-4 hover:bg-background transition-all duration-150">
                  <div className="flex items-center gap-3 min-w-[280px] max-w-[400px] flex-shrink-0">
                    <ActivityAvatar url={item.avatarUrl} name={item.user} />
                    <div className="min-w-0 flex-1">
                      <p className="text-base text-foreground-1 truncate">
                        <span className="font-semibold text-foreground">{item.user}</span>
                        <span className="text-foreground-2/75 ml-1">{item.action}</span>
                      </p>
                      <p className="text-sm text-foreground-3 truncate">
                        {item.role} · {item.department}
                      </p>
                    </div>
                  </div>

                  {hasContext && (
                    <div className="hidden md:flex flex-1 min-w-[150px] max-w-[500px] px-4 border-l border-background-4 h-10 items-center">
                      <div className="truncate text-base w-full">
                        {item.contextTitle && (
                          <span className={`font-semibold tracking-wide ${styles.textColor}`}>
                            {item.contextTitle}
                          </span>
                        )}
                        {item.contextDetails && (
                          <span className="text-foreground-3 ml-1">
                            · {item.contextDetails}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-right flex-shrink-0 w-36 text-base text-foreground-3 group-hover:text-foreground-3 transition-colors">
                    {item.relativeTime}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </FilterLayout>
  );
}