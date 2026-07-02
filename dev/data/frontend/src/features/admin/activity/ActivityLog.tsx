import React, { useState } from 'react';
import { FilterLayout } from '@shared';
import { mockActivityLog } from '@/shared/lib/mocks/adminActivityData';

interface ActivityEvent {
  id: string;
  type: string;
  time: string;
  relativeTime: string;
  user: string;
  role: string;
  department: string;
  action: string;
  contextTitle?: string;
  contextDetails?: string;
}

export function ActivityLog() {
  const [activeTab, setActiveTab] = useState<'All' | 'Presence' | 'Spaces' | 'Tasks' | 'Meetings'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activities] = useState<ActivityEvent[]>(mockActivityLog as ActivityEvent[]);

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

  const filteredActivities = activities
    .filter((item) => {
      if (activeTab === 'All') return true;
      if (activeTab === 'Presence') return item.type === 'presence';
      if (activeTab === 'Spaces') return item.type === 'space';
      if (activeTab === 'Tasks') return item.type === 'task';
      if (activeTab === 'Meetings') return item.type === 'meeting';
      return true;
    })
    .filter((item) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        item.user.toLowerCase().includes(searchLower) ||
        item.action.toLowerCase().includes(searchLower) ||
        (item.contextTitle && item.contextTitle.toLowerCase().includes(searchLower))
      );
    });

  const handleFilterChange = (filter: string) => {
    setActiveTab(filter as typeof activeTab);
  };

  return (
    <FilterLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search activities..."
      filterTabs={filterTabs}
      activeFilter={activeTab}
      onFilterChange={handleFilterChange}
      filterValue=""
      onFilterSelect={() => {}}
      filterOptions={[]}
      getFilterLabel={() => ''}
      showDropdown={false}
      isLoading={false}
      emptyMessage="No live activities stream discovered matching this view context."
      showPagination={false}
      containerHeight="calc(103vh - 120px)"
    >
      <div className="relative pl-4.5 space-y-2 h-full pt-8">
        <div className="absolute left-[19px] top-8 bottom-8 w-[1px] bg-background-4 pointer-events-none" />

        {filteredActivities.map((item) => {
          const styles = categoryStyles[item.type] || categoryStyles.space;
          const hasContext = item.contextTitle || item.contextDetails;
          
          return (
            <div key={item.id} className="relative flex items-stretch group">
              
              {/* Main Left Column - time, dot */}
              <div className="absolute top-1/2 -translate-y-1/2 flex items-center gap-12">
                <div className={`w-4 h-4 rounded-full ring-4 ring-background z-10 flex-shrink-0 ${styles.dotColor}`} />
                <span className="text-base font-medium text-foreground-1 w-20 text-left select-none">
                  {item.time}
                </span>
              </div>

              {/* Activity Card */}
              <div className="flex-grow flex items-center justify-between ml-42 bg-background-2 rounded-xl px-5 py-4 hover:bg-background transition-all duration-150">
                
                {/* Card Left Column - avatar, name, action, role, department*/}
                <div className="flex items-center gap-3 min-w-[280px] max-w-[400px] flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-white flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    {/* inline - name, action */}
                    <p className="text-base text-foreground-1 truncate">
                      <span className="font-semibold text-foreground">{item.user}</span>
                      <span className="text-foreground-2/75 ml-1">{item.action}</span>
                    </p>
                    {/* inline - role, department */}
                    <p className="text-sm text-foreground-3 truncate">
                      {item.role} · {item.department}
                    </p>
                  </div>
                </div>

                {/* Card Middle Column - context (only display there's context */}
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

                {/* Card Right Column - relative time */}
                <div className="text-right flex-shrink-0 w-36 text-base text-foreground-3 group-hover:text-foreground-3 transition-colors">
                  {item.relativeTime}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </FilterLayout>
  );
}
