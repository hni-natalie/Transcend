import { useMemo } from 'react';
import { IconCalendar, IconClock, IconUsers, IconPin } from '@shared';

type Meeting = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  participants: number;
  pinned?: boolean;
};

type Props = {
  label: string;
  meetings: Meeting[];
  action: 'join' | 'transcript' | 'manage';
  onTogglePin?: (id: string) => void;
};

export const MeetingColumn = ({
  label,
  meetings,
  action,
  onTogglePin,
}: Props) => {

  // Only derived data (NO state)
  const sortedMeetings = useMemo(() => {
    return [...meetings].sort(
      (a, b) => Number(b.pinned) - Number(a.pinned)
    );
  }, [meetings]);

  return (
    <div>
      {/* Column Header */}
      <div className="flex justify-between items-center bg-surface-secondary rounded-xl px-4 py-3 mb-2.5">
        <span className="text-sm font-medium text-text-primary">
          {label}
        </span>
        <span className="text-sm font-semibold text-accent-lime">
          {meetings.length}
        </span>
      </div>

      {/* Cards */}
      {sortedMeetings.map((meeting) => (
        <div
          key={meeting.id}
          className="bg-surface-secondary rounded-xl p-3.5 mb-2"
        >
          {/* Title + Pin */}
          <div className="flex justify-between items-start mb-0.5">
            <p className="text-sm font-medium text-text-primary">
              {meeting.title}
            </p>

            <button
              onClick={() => onTogglePin?.(meeting.id)}
              className="text-text-tertiary hover:text-text-secondary transition"
            >
              <IconPin
                className="w-4 h-4"
                active={meeting.pinned}
              />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs text-text-tertiary mb-2.5 leading-snug">
            {meeting.description}
          </p>

          {/* Meta */}
          <div className="flex flex-col gap-1 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <IconCalendar className="w-3.5 h-3.5" />
              {meeting.date}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <IconClock className="w-3.5 h-3.5" />
              {meeting.time} · {meeting.duration}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <IconUsers className="w-3.5 h-3.5" />
              {meeting.participants} participants
            </div>
          </div>

          {/* Actions */}
          {action === 'join' ? (
            <button className="w-full bg-accent-lime text-surface-primary text-xs font-semibold py-1.5 rounded-lg">
              Join Meeting
            </button>
          ) : action === 'transcript' ? (
            <button className="w-full border border-accent-lime text-accent-lime text-xs font-semibold py-1.5 rounded-lg">
              View Transcript
            </button>
          ) : (
            <div className="flex gap-2">
              <button className="flex-1 bg-accent-lime text-surface-primary text-xs font-semibold py-1.5 rounded-lg">
                Start
              </button>
              <button className="flex-1 border border-accent-lime text-accent-lime text-xs font-semibold py-1.5 rounded-lg">
                Edit
              </button>
              <button className="flex-1 border border-red-500 text-red-400 text-xs font-semibold py-1.5 rounded-lg">
                Delete
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};