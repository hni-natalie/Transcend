import { apiClient } from '@api/api.client';
import { API_CONFIG } from '@api/api.config';
import { ActivityEvent, ActivityPagination, GetActivitiesParams } from '../types';

const base = API_CONFIG.endpoints.activity;

// response shape for getAllActivities; kept here since it's a network-response wrapper, not a domain type
export interface ActivityListResponse {
  success: boolean;
  data: ActivityEvent[];
  pagination: ActivityPagination;
}

const TAB_TO_TYPE: Record<string, string | undefined> = {
  All: undefined,
  Presence: 'presence',
  Spaces: 'space',
  Tasks: 'task',
  Meetings: 'meeting',
};

export const activityApi = {
  getAllActivities({ type, search, page = 1, limit = 20, startDate, endDate }: GetActivitiesParams): Promise<ActivityListResponse> {
    const params = new URLSearchParams();
    const backendType = type ? TAB_TO_TYPE[type] : undefined;
    if (backendType) params.set('type', backendType);
    if (search) params.set('search', search);
	if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    params.set('page', String(page));
    params.set('limit', String(limit));

    return apiClient.get(`${base}?${params.toString()}`);
  },

  getRecentActivities(type?: string, limit = 3): Promise<{ success: boolean; data: ActivityEvent[] }> {
    const params = new URLSearchParams();
    const backendType = type ? TAB_TO_TYPE[type] : undefined;
    if (backendType) params.set('type', backendType);
    params.set('limit', String(limit));

    return apiClient.get(`${base}/recent?${params.toString()}`);
  },

  exportActivities(type?: string, search?: string): Promise<string> {
    const params = new URLSearchParams();
    const backendType = type ? TAB_TO_TYPE[type] : undefined;
    if (backendType) params.set('type', backendType);
    if (search) params.set('search', search);
    params.set('format', 'csv');

    return apiClient.get(`${base}/export?${params.toString()}`, {
      responseType: 'text',
    });
  },
};