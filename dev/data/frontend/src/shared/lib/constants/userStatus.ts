import type { UserBackendStatus } from '@shared/types/user.types';

export type UserStatusType = UserBackendStatus;

export const STATUS_DISPLAY: Record<UserStatusType, string> = {
  online: 'Online',
  focus: 'Focus',
  in_meeting: 'In Meeting',
  offline: 'Offline',
  away: 'Away'
};


export const STATUS_COLORS: Record<UserStatusType, {
  dot: string;        // small dot on avatr (menuside)
  bg: string;
  text: string;
  border: string;
  ring: string;
}> = {
  online: {
    dot: 'bg-accent-lime',
    bg: 'bg-accent-lime-bg',
    text: 'text-accent-lime',
    border: 'border-accent-lime',
    ring: 'ring-accent-lime/20',
  },
  focus: {
    dot: 'bg-accent-teal',
    bg: 'bg-accent-teal-bg',
    text: 'text-accent-teal',
    border: 'border-accent-teal',
    ring: 'ring-accent-teal/20',
  },
  in_meeting: {
    dot: 'bg-accent-gold',
    bg: 'bg-accent-gold-bg',
    text: 'text-accent-gold',
    border: 'border-accent-gold',
    ring: 'ring-accent-gold/20',
  },
    away: {
    dot: 'bg-accent-purple',
    bg: 'bg-accent-purple-bg',
    text: 'text-accent-purple',
    border: 'border-accent-purple',
    ring: 'ring-accent-purple/20',
  },
  offline: {
    dot: 'bg-foreground-4',
    bg: 'bg-background-3',
    text: 'text-foreground-4',
    border: 'border-foreground-4/30',
    ring: 'ring-foreground-4/10',
  },
};

export const getStatusDisplay = (status: UserStatusType): string => {
  return STATUS_DISPLAY[status] || status || 'Unknown';
};

export const getStatusColors = (status: UserStatusType) => {
  return STATUS_COLORS[status] || STATUS_COLORS.offline;
};

export const getStatusDotColor = (status: UserStatusType): string => {
  return getStatusColors(status).dot;
};

export const getStatusBgColor = (status: UserStatusType): string => {
  return getStatusColors(status).bg;
};

export const getStatusTextColor = (status: UserStatusType): string => {
  return getStatusColors(status).text;
};

export const getStatusBorderColor = (status: UserStatusType): string => {
  return getStatusColors(status).border;
};

export const getStatusRingColor = (status: UserStatusType): string => {
  return getStatusColors(status).ring;
};

export const isUserOnline = (status: UserStatusType): boolean => {
  return status === 'online';
};

export const isUserFocus = (status: UserStatusType): boolean => {
  return status === 'focus';
};

export const isUserInMeeting = (status: UserStatusType): boolean => {
  return status === 'in_meeting';
};

export const isUserAway = (status: UserStatusType): boolean => {
  return status === 'away';
};

export const isUserOffline = (status: UserStatusType): boolean => {
  return status === 'offline';
};

// for dashboard - sort by status priority
export const getStatusPriority = (status: UserStatusType): number => {
  const priorities: Record<UserStatusType, number> = {
    online: 0,
    focus: 1,
    in_meeting: 2,
	away: 3,
    offline: 4,
  };
  return priorities[status] ?? 3;
};

export const sortByStatus = <T extends { status: UserStatusType }>(
  users: T[]
): T[] => {
  return [...users].sort((a, b) => {
    return getStatusPriority(a.status) - getStatusPriority(b.status);
  });
};


export const getStatusBadgeProps = (status: UserStatusType) => {
  const colors = getStatusColors(status);
  return {
    label: getStatusDisplay(status),
    className: `${colors.bg} ${colors.text} border ${colors.border}`,
  };
};

export const STATUS_OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'focus', label: 'Focus' },
  { value: 'in_meeting', label: 'In Meeting' },
  { value: 'away', label: 'Away' },
  { value: 'offline', label: 'Offline' },
] as const;