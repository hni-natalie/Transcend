import { useEffect, useState, useRef } from 'react';
import { apiClient } from '@api/api.client';
import { API_CONFIG } from '@api/api.config';
import { useSocket, useToast } from '@/context';
import { useAuth } from '@/features/auth';
import { DashboardData } from './types';
import { UserBackendStatus } from '@/shared';


export const useDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, userStatuses } = useSocket();
  const { showToast } = useToast();


  useEffect(() => {
    if (!isConnected) {
      setIsLoading(true);
      return;
    }

    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<DashboardData>(
          API_CONFIG.endpoints.users.userDashboard
        );
        setData(response);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
        showToast('error', 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [isConnected]);

  const dataWithLiveStatus: DashboardData | null = data
  ? {
      ...data,
      allUsers: data.allUsers.map(u => ({
        ...u,
        userStatus: userStatuses[u.userId] ?? u.userStatus,
      })),
      currentUser: {
        ...data.currentUser,
        userStatus: userStatuses[data.currentUser.userId] ?? data.currentUser.userStatus,
      },
    }
  : null;

  return { data: dataWithLiveStatus, setData, isLoading, error };
};

export const useSessionTimer = (lastLoginAt: string | null | undefined) => {
  const [sessionTime, setSessionTime] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!lastLoginAt) return;
    
    const loginTime = new Date(lastLoginAt).getTime();
    
    const calculateElapsedTime = () => {
      const now = Date.now();
      const elapsedMs = now - loginTime;
      const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
      const minutes = Math.floor((elapsedMs % (3600000)) / (1000 * 60));
      const seconds = Math.floor((elapsedMs % (60000)) / 1000);
      setSessionTime({ hours, minutes, seconds });
    };

    calculateElapsedTime();
    const timer = setInterval(calculateElapsedTime, 1000);
    
    return () => clearInterval(timer);
  }, [lastLoginAt]);

  return { sessionTime };
};

export const useStatusUpdate = (
  setData: React.Dispatch<React.SetStateAction<DashboardData | null>>
) => {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { updateUserStatus } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateStatus = async (newStatus: UserBackendStatus) => {
    try {
      setUpdatingStatus(true);
      await updateUserStatus(newStatus);

      setData(prev =>
        prev
          ? { ...prev, currentUser: { ...prev.currentUser, userStatus: newStatus } }
          : null
      );

      setShowStatusDropdown(false);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return {
    showStatusDropdown,
    setShowStatusDropdown,
    updatingStatus,
    dropdownRef,
    updateStatus,
  };
};
