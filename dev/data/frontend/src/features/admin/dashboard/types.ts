import type { UserBackendStatus } from '@shared/types/user.types';
import type { Space } from '@/shared/types/space.types';

export interface DbUser {
  id: string;
  name: string;
  status: UserBackendStatus;
  department: string;
  avatarUrl?: string | null;
}

export interface DashboardMetricsResponse {
  users: DbUser[];
}

// TO REMOVE
// interface DepartmentRatio {
//   active: number;
//   total: number;
// }

export interface SpaceWithOccupancy extends Space {
  currentOccupancy: number;
}

export interface SpaceRatio {
  name: string;
  count: number;
  max: number;
  group: 'shared' | 'department';
}

export interface ActivityItem {
  id: string;
  name: string;
  action: string;
  context: string;
  time: string;
}