import { useEffect, useState, useRef } from 'react';
import { apiClient } from '@api/api.client';
import { API_CONFIG } from '@api/api.config';
import { DashboardData } from './types';
import { UserBackendStatus } from '@/shared';
import { useAuth } from '@/features/auth';
import { useSocket } from '@/context/SocketContext';

export const useDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useSocket();


  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        if (!isConnected) return;
        setIsLoading(true);
        const response = await apiClient.get<DashboardData>(
          API_CONFIG.endpoints.users.userDashboard
        );
        setData(response);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
    if (!isConnected)
      setIsLoading(true);
  }, [isConnected]);

  return { data, setData, isLoading, error };
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
      updateUserStatus(newStatus);

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