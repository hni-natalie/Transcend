import { useState, useEffect } from 'react';
import { apiClient } from '@api/api.client';
import { useToast } from '@/context/ToastContext';
import { DbUser, DashboardMetricsResponse } from './types';

export const useDashboardData = () => {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

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

 // METRICS
  const totalCount = users.length || 1;
  const onlineUsers = users.filter(u => u.status !== 'offline');
  const availableCount = users.filter(u => u.status === 'online').length;
  const focusCount = users.filter(u => u.status === 'focus').length;
  const inMeetingCount = users.filter(u => u.status === 'in_meeting').length;

  const attendancePercentage = ((onlineUsers.length / totalCount) * 100).toFixed(1);
  const checkedInPercentage = ((availableCount / totalCount) * 100).toFixed(1);
  const absentPercentage = ((users.filter(u => u.status === 'offline').length / totalCount) * 100).toFixed(1);

  const getDepartmentRatio = (deptName: string) => {
    const deptGroup = users.filter(u => u.department === deptName);
    const active = deptGroup.filter(u => u.status !== 'offline').length;
    return { active, total: deptGroup.length };
  };

  // exclude admin and test users
  const isExcludedUser = (user: DbUser) => {
    const name = user.name?.toLowerCase() || '';
    return name.includes('admin') || name.includes('administrator') || name.includes('test');
  };

  return {
    users,
    isLoading,
    metrics: {
      totalCount,
      onlineUsers,
      availableCount,
      focusCount,
      inMeetingCount,
      attendancePercentage,
      checkedInPercentage,
      absentPercentage,
    },
    getDepartmentRatio,
    isExcludedUser,
  };
};