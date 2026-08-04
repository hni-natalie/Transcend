import { SpaceRatio, ActivityItem } from '@features/admin/dashboard/types';

export const mockSpacesProgress: SpaceRatio[] = [
  { name: 'The Town Hall', count: 0, max: 100, group: 'shared' },
  { name: 'Meeting Room S', count: 3, max: 4, group: 'shared' },
  { name: 'Meeting Room M', count: 0, max: 12, group: 'shared' },
  { name: 'Meeting Room L', count: 0, max: 30, group: 'shared' },
  
  { name: 'People Ops Hub', count: 4, max: 4, group: 'department' },
  { name: 'Audit Vault', count: 2, max: 3, group: 'department' },
  { name: 'Logistics Ops Hub', count: 0, max: 4, group: 'department' },
  { name: 'Growth Lab', count: 2, max: 5, group: 'department' },
  { name: 'Dev Lab', count: 10, max: 10, group: 'department' },
  { name: 'Creative Lab', count: 0, max: 4, group: 'department' },
];

export const presenceStream: ActivityItem[] = [
  { id: 'p1', name: 'Owen Carter', action: 'logged in', context: 'Dev Lab', time: '11:45 AM' },
  { id: 'p2', name: 'Sarah Jenkins', action: 'logged in', context: 'Audit Vault', time: '11:32 AM' },
  { id: 'p3', name: 'Devon Lane', action: 'logged out', context: 'Dev Lab', time: '11:15 AM' }
];

export const tasksStream: ActivityItem[] = [
  { id: 't1', name: 'James Smith', action: 'completed', context: 'Scheduled Meeting', time: '11:20 AM' },
  { id: 't2', name: 'Nina Vance', action: 'completed', context: 'Logistics Update', time: '10:55 AM' },
  { id: 't3', name: 'Zara Ahmed', action: 'created', context: 'Site Maintenance', time: '10:12 AM' }
];

export const meetingsStream: ActivityItem[] = [
  { id: 'm1', name: 'Meeting Room S', action: 'session started', context: 'Q3 Accounts Audit', time: '11:00 AM' },
  { id: 'm2', name: 'Meeting Room L', action: 'session ended', context: 'Frontend Design Sync', time: '10:30 AM' },
  { id: 'm3', name: 'Meeting Room S', action: 'session booked', context: 'WorkFrom Core Architecture', time: '10:00 AM' }
];
