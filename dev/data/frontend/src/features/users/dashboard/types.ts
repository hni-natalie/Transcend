import { Department, DashboardUser, UserBackendStatus } from '@shared';

export type { Department };

export interface CurrentUser extends DashboardUser {
}

export interface FeaturedMember {
  userName: string;
  userEmail: string;
  userStatus: UserBackendStatus;
  avatarUrl: string | null;
  country: string | null;
  timezone: string | null;
  role?: { roleName: string };
  isCurrentUser: boolean;
}

export interface TeamMember {
  userId: string;
  userName: string;
  userEmail: string;
  userStatus: UserBackendStatus;
  avatarUrl: string | null;
  country: string | null;
  timezone: string | null;
  department: Department | null;
  role?: { roleName: string };
  isCurrentUser?: boolean;
}

export interface UserTask {
  taskId: string;
  taskTitle: string;
  taskDesc: string | null;
  taskStatus: 'not_started' | 'in_progress' | 'done';
  dueDate: string | null;
  taskPriority: 'low' | 'medium' | 'high';
}

export interface UserMeeting {
  meetId: string;
  meetTitle: string;
  meetDesc: string;
  meetStart: string;
  meetEnd: string;
  spaceName: string | null;
  role: 'organiser' | 'participant';
}

export interface DashboardData {
  currentUser: CurrentUser;
  allUsers: TeamMember[];
  tasks: UserTask[];
  meetings: UserMeeting[];
}

export interface CalendarDay {
  day: number;
  type: 'prev-month' | 'next-month' | 'current-month' | 'current-highlight' | 'event-amber';
  meetingCount?: number;
  taskCount?: number;
}
