import { useState, useEffect } from 'react';
import { apiClient } from '@api/api.client';
import { useToast } from '@/context/ToastContext';
import { useSocket } from '@/context/SocketContext';
import { activityApi } from '@/features/admin/activity/api/activity.api';
import { officeService } from '@/features/office/services/office.service'; // adjust to actual path
import { Space } from '@/shared/types/space.types'; // adjust path to match actual location
import { SpaceWithOccupancy } from './types';
import { DbUser, DashboardMetricsResponse, ActivityItem } from './types';

const OFFICE_SPACE_NAMES = new Set([
  // shared
  'The Town Hall',
  'Meeting Room S',
  'Meeting Room M',
  'Meeting Room L',

  // department
  'Audit Vault',
  'Creative Lab',
  'Dev Lab',
  'Growth Lab',
  'Logistics Ops Hub',
  'People Ops Hub',
]);

const toActivityItem = (e: any): ActivityItem => ({
  id: e.id,
  name: e.user,
  action: e.action,
  context: e.contextTitle || e.contextDetails || '',
  time: e.time,
});

export const useDashboardData = () => {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const { enableSocket, isConnected, userStatuses, roomOccupancy, subscribeDashboard, unsubscribeDashboard } = useSocket();

  const [presenceItems, setPresenceItems] = useState<ActivityItem[]>([]);
  const [tasksItems, setTasksItems] = useState<ActivityItem[]>([]);
  const [meetingsItems, setMeetingsItems] = useState<ActivityItem[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(true);

  // NEW — spaces state
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isSpacesLoading, setIsSpacesLoading] = useState(true);

  useEffect(() => { enableSocket(); }, []);

  useEffect(() => {
    if (!isConnected) return;
    subscribeDashboard();
    return () => unsubscribeDashboard();
  }, [isConnected, subscribeDashboard, unsubscribeDashboard]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await apiClient.get<DashboardMetricsResponse>('/users/dashboard/metrics');
        if (data && Array.isArray(data.users)) {
          setUsers(data.users);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        showToast('error', 'Failed to load dashboard data');
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [showToast]);

  useEffect(() => {
    const fetchActivityStreams = async () => {
      try {
        const [presenceRes, tasksRes, meetingsRes] = await Promise.all([
          activityApi.getRecentActivities('Presence', 3),
          activityApi.getRecentActivities('Tasks', 3),
          activityApi.getRecentActivities('Meetings', 3),
        ]);
        setPresenceItems(presenceRes.data.map(toActivityItem));
        setTasksItems(tasksRes.data.map(toActivityItem));
        setMeetingsItems(meetingsRes.data.map(toActivityItem));
      } catch (err) {
        console.error('Failed to fetch activity streams:', err);
        showToast('error', 'Failed to load recent activity');
      } finally {
        setIsActivityLoading(false);
      }
    };

    fetchActivityStreams();
  }, [showToast]);

  // NEW — fetch spaces
  useEffect(() => {
	const fetchSpaces = async () => {
		try {
		const res = await officeService.getAllSpaces();
		setSpaces((res.data as unknown as Space[]) || []); // cast until SpaceResponse.data is fixed to Space[]
		} catch (err) {
		console.error('Failed to fetch spaces:', err);
		showToast('error', 'Failed to load spaces');
		} finally {
		setIsSpacesLoading(false);
		}
	};
	fetchSpaces();
  }, [showToast]);

  const usersWithLiveStatus = users.map(u => ({
	...u,
	status: userStatuses[u.id] ?? u.status,
  }));

  const spacesWithOccupancy: SpaceWithOccupancy[] = spaces
  .filter(s => OFFICE_SPACE_NAMES.has(s.spaceName))
  .map((s) => ({
    ...s,
    currentOccupancy: roomOccupancy[s.spaceId] ?? 0,
  }));

  // METRICS — per-status breakdown (feeds the 3 colored rings, unchanged)
  const totalCount = usersWithLiveStatus.length || 1;
  const availableCount = usersWithLiveStatus.filter(u => u.status === 'online').length;
  const focusCount = usersWithLiveStatus.filter(u => u.status === 'focus').length;
  const inMeetingCount = usersWithLiveStatus.filter(u => u.status === 'in_meeting').length;

  // METRICS — Active / Attendance / Absent summary
  const activeCount = usersWithLiveStatus.filter(u => u.status === 'online').length;
  const attendanceCount = usersWithLiveStatus.filter(u => u.status !== 'offline').length;
  const absentCount = usersWithLiveStatus.filter(u => u.status === 'offline').length;

  const activePercentage = ((activeCount / totalCount) * 100).toFixed(1);
  const attendancePercentage = ((attendanceCount / totalCount) * 100).toFixed(1);
  const absentPercentage = ((absentCount / totalCount) * 100).toFixed(1);

  const getDepartmentRatio = (deptName: string) => {
    const deptGroup = users.filter(u => u.department === deptName);
    const active = deptGroup.filter(u => u.status !== 'offline').length;
    return { active, total: deptGroup.length };
  };

  const isExcludedUser = (user: DbUser) => {
    const name = user.name?.toLowerCase() || '';
    return name.includes('admin') || name.includes('administrator') || name.includes('test');
  };

  return {
    users: usersWithLiveStatus,
    isLoading,
    metrics: {
      totalCount,
      availableCount,
      focusCount,
      inMeetingCount,
      activePercentage,
      attendancePercentage,
      absentPercentage,
    },
    spaces: spacesWithOccupancy,
    isSpacesLoading,
    getDepartmentRatio,
    isExcludedUser,
    presenceItems,
    tasksItems,
    meetingsItems,
    isActivityLoading,
  };
};
