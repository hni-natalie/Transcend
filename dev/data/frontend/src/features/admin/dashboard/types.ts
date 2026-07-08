export interface DbUser {
  id: string;
  name: string;
  status: 'online' | 'focus' | 'in_meeting' | 'away' | 'offline';
  department: string;
  avatarUrl?: string | null;
}

export interface DashboardMetricsResponse {
  users: DbUser[];
}

export interface DepartmentRatio {
  active: number;
  total: number;
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