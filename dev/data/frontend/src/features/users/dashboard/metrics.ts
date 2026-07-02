import { UserMeeting, UserTask } from './types';
import { getStatusDisplay, getStatusColors, UserStatusType } from '@shared/lib/constants/userStatus';

// MEETING COUNTDOWN RING
export const getMeetingProgressOffset = (meeting: UserMeeting | null): number => {
  const circumference = 116.2; // 2 * PI * 18.5
  
  if (!meeting) return circumference;
  
  const now = new Date();
  const meetStart = new Date(meeting.meetStart);
  const timeUntilMeeting = meetStart.getTime() - now.getTime();
  
  if (timeUntilMeeting <= 0) return 0;
  const minutesUntilMeeting = timeUntilMeeting / (1000 * 60);
  const totalWindowMinutes = 60;
  
  let progress: number;
  if (minutesUntilMeeting >= totalWindowMinutes) {
    progress = 0;
  } else {
    progress = 1 - (minutesUntilMeeting / totalWindowMinutes);
  }
  
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  return circumference * (1 - clampedProgress);
};

export const getMeetingCountdownDisplay = (meeting: UserMeeting | null): string => {
  if (!meeting) return '';
  
  const now = new Date();
  const meetStart = new Date(meeting.meetStart);
  const timeUntilMeeting = meetStart.getTime() - now.getTime();

  if (timeUntilMeeting <= 0) return 'Now';
  
  const minutesUntil = Math.floor(timeUntilMeeting / (1000 * 60));
  const hoursUntil = Math.floor(minutesUntil / 60);
  const remainingMinutes = minutesUntil % 60;
  
  if (hoursUntil > 0) {
    return `${hoursUntil}h ${remainingMinutes}m`;
  }
  
  return `${minutesUntil}m`;
};


export const getNextMeeting = (meetings: UserMeeting[]): UserMeeting | null => {
  const now = new Date();
  const upcomingMeetings = meetings
    .filter(m => new Date(m.meetStart) > now)
    .sort((a, b) => new Date(a.meetStart).getTime() - new Date(b.meetStart).getTime());
  
  return upcomingMeetings[0] || null;
};

// MEETING METRICS
export const getMeetingsToday = (meetings: UserMeeting[], now: Date = new Date()): number =>
  meetings.filter(m => new Date(m.meetStart).toDateString() === now.toDateString()).length;

export const getMeetingsThisWeek = (meetings: UserMeeting[], now: Date = new Date()): number => {
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return meetings.filter(m => {
    const meetDate = new Date(m.meetStart);
    return meetDate >= startOfWeek && meetDate <= endOfWeek;
  }).length;
};

export const getMeetingsThisMonth = (meetings: UserMeeting[], now: Date = new Date()): number =>
  meetings.filter(m => {
    const meetDate = new Date(m.meetStart);
    return meetDate.getMonth() === now.getMonth() && meetDate.getFullYear() === now.getFullYear();
  }).length;

export const getTasksToday = (tasks: UserTask[], now: Date = new Date()): number =>
  tasks.filter(t => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate).toDateString() === now.toDateString();
  }).length;

export const getTasksThisWeek = (tasks: UserTask[], now: Date = new Date()): number => {
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return tasks.filter(t => {
    if (!t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    return dueDate >= startOfWeek && dueDate <= endOfWeek;
  }).length;
};

export const getTasksThisMonth = (tasks: UserTask[], now: Date = new Date()): number =>
  tasks.filter(t => {
    if (!t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    return dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear();
  }).length;

export const getStatusDisplayWithColors = (status: string) => {
  const statusType = status as UserStatusType;
  const display = getStatusDisplay(statusType);
  const colors = getStatusColors(statusType);
  
  return {
    text: display,
    color: colors.text,
    ringColor: colors.dot,
  };
};

export const sortTasksByUrgency = (tasks: UserTask[], now: Date = new Date()): UserTask[] =>
  [...tasks].sort((a, b) => {
    const aIsToday = !!a.dueDate && new Date(a.dueDate).toDateString() === now.toDateString();
    const bIsToday = !!b.dueDate && new Date(b.dueDate).toDateString() === now.toDateString();
    const aIsHigh = a.taskPriority === 'high';
    const bIsHigh = b.taskPriority === 'high';

    if (aIsToday && aIsHigh && !(bIsToday && bIsHigh)) return -1;
    if (bIsToday && bIsHigh && !(aIsToday && aIsHigh)) return 1;
    if (aIsToday && !bIsToday) return -1;
    if (bIsToday && !aIsToday) return 1;
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && b.dueDate)
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    return 0;
  });
