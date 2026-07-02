import React from 'react';
import { LoadingState, EmptyState } from '@/shared';
import { useDashboardData } from './hooks';
import { MetricsRing, StatusGrid, DepartmentStats, OfficeMap, SpacesProgress, ActivityStreams } from './components';

export const Dashboard = () => {
  const { users, isLoading, metrics, getDepartmentRatio, isExcludedUser } = useDashboardData();

  if (isLoading) {
    return <LoadingState message="Synchronizing cluster aggregates..." size="full" />;
  }

  if (users.length === 0) {
    return <EmptyState message="No user data available" size="medium" />;
  }

  return (
    <div className="">
      <div className="flex gap-6">
        {/* LEFT */}
        <div className="w-[27%] p-5 pt-0">
          <MetricsRing
            availableCount={metrics.availableCount}
            focusCount={metrics.focusCount}
            inMeetingCount={metrics.inMeetingCount}
            totalCount={metrics.totalCount}
            attendancePercentage={metrics.attendancePercentage}
            checkedInPercentage={metrics.checkedInPercentage}
            absentPercentage={metrics.absentPercentage}
          />
          <StatusGrid users={users} isExcludedUser={isExcludedUser} />
        </div>

        {/* RIGHT */}
        <div className="w-[72%] space-y-6">
          <DepartmentStats getDepartmentRatio={getDepartmentRatio} />
          
          <div className="grid grid-cols-16 gap-3">
            <OfficeMap />
            <SpacesProgress />
          </div>

          <ActivityStreams />
        </div>
      </div>
    </div>
  );
};
