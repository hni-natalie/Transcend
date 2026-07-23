// TO REMOVE ONCE BE IS IMPLEMENTED (used for mock for group chat)
import { useMemo } from 'react';
import { useRolesAndDepartments } from '@/shared/hooks/useRolesAndDepartments';
import type { User } from '@shared';

export interface GroupMessage {
  id: string;
  name: string;
  members: User[];
  memberCount: number;
}

interface UseGroupMessagesOptions {
  users?: User[];
  maxMembers?: number;
}

export const useGroupMessages = ({ users = [], maxMembers = 10 }: UseGroupMessagesOptions = {}) => {
  const { departments, isLoading: deptsLoading, refetch: refetchDepts } = useRolesAndDepartments();

  const groupMessages = useMemo(() => {
    if (deptsLoading) {
      return [];
    }

    try {
      const deptMap = new Map<string, { name: string; members: User[] }>();

      users.forEach((user) => {
        const deptId = user.department?.dpId || 'unknown';
        const deptName = user.department?.dpName || 'Other';

        if (!deptMap.has(deptId)) {
          const dept = departments.find((department) => department.dpId === deptId);

          deptMap.set(deptId, { name: dept?.dpName || deptName, members: [] });
        }

        deptMap.get(deptId)?.members.push(user);
      });

      const groups: GroupMessage[] = [];

      deptMap.forEach(({ name, members }, id) => {
        groups.push({
          id,
          name,
          members: members.slice(0, maxMembers),
          memberCount: members.length,
        });
      });

      return groups.sort((a, b) => b.memberCount - a.memberCount);
    } catch {
      return [];
    }
  }, [departments, users, deptsLoading, maxMembers]);

  return {
    groupMessages,
    loading: deptsLoading,
    error: null,
    refetch: refetchDepts,
  };
};
