import { CalendarDay, UserMeeting, UserTask } from './types';

export const getCalendarDays = (
  meetings: UserMeeting[],
  tasks: UserTask[],
  currentDate: Date = new Date()
): CalendarDay[] => {
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const days: CalendarDay[] = [];

  const getMeetingCountForDay = (day: number) =>
    meetings.filter(m => {
      const meetDate = new Date(m.meetStart);
      return meetDate.getDate() === day && meetDate.getMonth() === currentDate.getMonth();
    }).length;

  const getTaskCountForDay = (day: number) =>
    tasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate.getDate() === day && dueDate.getMonth() === currentDate.getMonth();
    }).length;

  // previous month padding
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push({ day: 0, type: 'prev-month' });
  }

  // current month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const meetingCount = getMeetingCountForDay(i);
    const taskCount = getTaskCountForDay(i);
    const hasEvents = meetingCount > 0 || taskCount > 0;

    if (i === currentDate.getDate()) {
      days.push({ day: i, type: 'current-highlight', meetingCount, taskCount });
    } else if (hasEvents) {
      days.push({ day: i, type: 'event-amber', meetingCount, taskCount });
    } else {
      days.push({ day: i, type: 'current-month' });
    }
  }

  // next month padding
  while (days.length % 7 !== 0) {
    days.push({ day: 0, type: 'next-month' });
  }

  return days;
};

export const getCalendarTooltip = (d: CalendarDay): string => {
  if (d.type === 'prev-month' || d.type === 'next-month') return '';
  if (d.type === 'current-highlight' && !d.meetingCount && !d.taskCount) return 'Today';

  const parts: string[] = [];
  if (d.meetingCount && d.meetingCount > 0)
    parts.push(`${d.meetingCount} meeting${d.meetingCount > 1 ? 's' : ''}`);
  if (d.taskCount && d.taskCount > 0)
    parts.push(`${d.taskCount} task${d.taskCount > 1 ? 's' : ''} due`);
  if (parts.length === 0 && d.type === 'current-highlight') return 'Today';

  return parts.join(' • ');
};