import { useMemo } from 'react';
import {
  IconCalendar,
  IconClock,
  IconUsers,
  IconPin,
} from '@shared';

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
  onViewMore?: (id: string) => void; // 👈 add this
};

// truncate helper
const truncateWords = (text: string, limit: number) => {
  const words = text.split(' ');
  if (words.length <= limit) return text;
  return words.slice(0, limit).join(' ') + '...';
};

export const MeetingColumn = ({
  label,
  meetings,
  action,
  onTogglePin,
  onViewMore,
}: Props) => {
  const sortedMeetings = useMemo(() => {
    return [...meetings].sort(
      (a, b) => Number(b.pinned) - Number(a.pinned)
    );
  }, [meetings]);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center bg-surface-secondary rounded-xl px-4 py-3 mb-2.5">
        <span className="text-sm font-medium text-text-primary">
          {label}
        </span>

        <span className="text-sm font-semibold text-accent-lime">
          {meetings.length}
        </span>
      </div>

      {/* Empty State */}
      {sortedMeetings.length === 0 ? (
        <div className="bg-surface-secondary rounded-xl p-8 min-h-[180px] flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-text-secondary">
            No meetings
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            Nothing scheduled here yet
          </p>
        </div>
      ) : (
        sortedMeetings.map((meeting) => (
          <div
            key={meeting.id}
            className="bg-surface-secondary rounded-xl p-3.5 mb-2"
          >
            {/* Title + Pin */}
            <div className="flex justify-between items-start mb-0.5">
              <p className="text-sm font-medium text-text-primary">
                {truncateWords(meeting.title, 3)}
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
              {truncateWords(meeting.description, 8)}
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

            {/* View More (ABOVE ACTION BUTTONS) */}
            <button
              onClick={() => onViewMore?.(meeting.id)}
              className="text-xs text-accent-lime font-medium mb-2 hover:underline"
            >
              View more
            </button>

            {/* Actions */}
            {action === 'join' ? (
              <button className="w-full bg-accent-lime text-surface-primary text-xs font-semibold py-1.5 rounded-lg hover:opacity-90 transition-opacity">
                Join Meeting
              </button>
            ) : action === 'transcript' ? (
              <button className="w-full border border-accent-lime text-accent-lime text-xs font-semibold py-1.5 rounded-lg hover:bg-accent-lime/10 transition-colors">
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
        ))
      )}
    </div>
  );
};
