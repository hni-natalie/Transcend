import React from 'react';
import { LoadingState, EmptyState } from '@/shared';
import { useDashboardData } from './hooks';
import { MetricsRing, StatusGrid, DepartmentStats, OfficeMap, SpacesProgress, ActivityStreams } from './components';

export const Dashboard = () => {
  const { users, isLoading, metrics, getDepartmentRatio, isExcludedUser, presenceItems, tasksItems, meetingsItems, spaces, } = useDashboardData();

  if (isLoading) {
    return <LoadingState message="Synchronizing cluster aggregates..." size="full" />;
  }

  if (users.length === 0) {
    return <EmptyState message="No user data available" size="medium" />;
  }

  return (
    <div className="p-4 md:p-0">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* LEFT - Full width on mobile, 27% on desktop */}
        <div className="w-full md:w-[27%] p-4 md:p-6 md:pt-0">
          <MetricsRing
            availableCount={metrics.availableCount}
            focusCount={metrics.focusCount}
            inMeetingCount={metrics.inMeetingCount}
            totalCount={metrics.totalCount}
            activePercentage={metrics.activePercentage}
            attendancePercentage={metrics.attendancePercentage}
            absentPercentage={metrics.absentPercentage}
          />
          <StatusGrid users={users} isExcludedUser={isExcludedUser} />
        </div>

        {/* RIGHT - Full width on mobile, 72% on desktop */}
        <div className="w-full md:w-[72%] space-y-3 md:space-y-3">
          <DepartmentStats getDepartmentRatio={getDepartmentRatio} />
          
          <div className="grid grid-cols-1 md:grid-cols-16 gap-3">
            <OfficeMap spaces={spaces}/>
            <SpacesProgress spaces={spaces}/>
          </div>

          <ActivityStreams
            presenceItems={presenceItems}
            tasksItems={tasksItems}
            meetingsItems={meetingsItems}
          />
        </div>
      </div>
    </div>
  );
};
