export type DateRangeFilter = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'custom';

export interface ActivityEvent {
  id: string;
  type: string;
  time: string;
  relativeTime: string;
  user: string;
  avatarUrl?: string | null;
  role: string;
  department: string;
  action: string;
  contextTitle?: string;
  contextDetails?: string;
}

export interface ActivityPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface GetActivitiesParams {
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface CustomDateRange {
  startDate: string; // ISO date (2026-07-01)
  endDate: string;
}