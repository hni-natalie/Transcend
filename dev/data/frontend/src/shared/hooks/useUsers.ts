import { useState, useEffect, useCallback } from 'react';
import { fetchAllUsers } from '@features/users';
import { User } from '@shared';
import { useAuth } from '@/features/auth/AuthContext';
import { useToast } from '@/context/ToastContext';

interface UseUsersOptions {
  excludeCurrentUser?: boolean;
  searchQuery?: string;
  departmentId?: string;
  roleId?: string;
}

export function useUsers(options: UseUsersOptions = {}) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const allUsers = await fetchAllUsers();
      
      let filteredUsers = allUsers;

      if (options.excludeCurrentUser && currentUser) {
        filteredUsers = filteredUsers.filter(user => user.userId !== currentUser.userId);
      }

      if (options.searchQuery) {
        const query = options.searchQuery.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.userName?.toLowerCase().includes(query) ||
          user.userEmail?.toLowerCase().includes(query) ||
          user.role?.roleName?.toLowerCase().includes(query) ||
          user.department?.dpName?.toLowerCase().includes(query)
        );
      }

      if (options.departmentId) {
        filteredUsers = filteredUsers.filter(user => 
          user.department?.dpId === options.departmentId
        );
      }

      if (options.roleId) {
        filteredUsers = filteredUsers.filter(user => 
          user.role?.roleId === options.roleId
        );
      }
      
      setUsers(filteredUsers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
      showToast('error', errorMessage);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [options.excludeCurrentUser, options.searchQuery, options.departmentId, options.roleId, currentUser, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const refetch = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, isLoading, error, refetch };
}