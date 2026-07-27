import { useMemo } from 'react';
import { ButtonVoiceRoom } from '@/features/livekit/components/ButtonVoiceRoom';
import { ROUTE_PATH as R } from '@config/routes.manifest';
import type { Meeting } from '@/features/meetings/meeting.types';

import {
  IconCalendar,
  IconClock,
  IconUsers,
  IconPin,
} from '@shared';


type Props = {
  label: string;
  meetings: Meeting[];
  action: 'join' | 'transcript' | 'manage';
  userId: string;

  onTogglePin?: (id: string) => void;
  onViewMore?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
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
  onDelete,
  onEdit,
  userId,
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
        sortedMeetings.map((meeting) => {
          const meetTitle = truncateWords(meeting.title, 3);
          const isHost = meeting.createdByUserId === userId;

          return (
            <div
              key={meeting.id}
              className="bg-surface-secondary rounded-xl p-3.5 mb-2"
            >
              {/* Title + Pin */}
              <div className="flex justify-between items-start mb-0.5">
                <p className="text-sm font-medium text-text-primary">
                  {meetTitle}
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

              {/* View More */}
              <button
                onClick={() => onViewMore?.(meeting.id)}
                className="text-xs text-accent-lime font-medium mb-2 hover:underline"
              >
                View more
              </button>

              {/* Actions */}
              {action === 'join' ? (
                meeting.status === "started" ? (
                  <ButtonVoiceRoom
                    joinText={isHost ? "Start Meeting" : "Join Meeting"}
                    roomName={meeting.id}
                    meetingTitle={meeting.title}
                    mode="video"
                    joinTo={R.USER_VIDEOCALL}
                    isHost={isHost}
                  />
                ) : isHost ? (
                  <ButtonVoiceRoom
                    joinText="Start Meeting"
                    roomName={meeting.id}
                    meetingTitle={meeting.title}
                    mode="video"
                    joinTo={R.USER_VIDEOCALL}
                    isHost={true}
                    className="w-full border border-accent-lime text-accent-lime text-xs font-semibold py-1.5 rounded-lg hover:bg-accent-lime/10 transition-colors cursor-pointer"
                  />
                ) : (
                  <button
                    disabled
                    className="w-full border border-gray-400 text-gray-400 text-xs font-semibold py-1.5 rounded-lg"
                  >
                    Waiting for host
                  </button>
                )
              ) : action === 'transcript' ? (
                <button className="w-full border border-accent-lime text-accent-lime text-xs font-semibold py-1.5 rounded-lg hover:bg-accent-lime/10 transition-colors cursor-pointer">
                  View Transcript
                </button>
              ) : (
                <div className="flex gap-2">
                  {/* <button className="flex-1 bg-accent-lime text-surface-primary text-xs font-semibold py-1.5 rounded-lg">
                    Start
                  </button> */}
                  <ButtonVoiceRoom 
                    className='btn-header' 
                    joinText='Start' 
                    roomName={meeting.id} 
                    meetingTitle={meeting.title} 
                    mode='video' 
                    joinTo={`${R.USER_VIDEOCALL}`}
                    isHost={true}
                  />

                <button 
                  onClick={() => onEdit?.(meeting.id)}
                  className="flex-1 border border-accent-lime text-accent-lime text-xs font-semibold py-1.5 rounded-lg cursor-pointer hover:bg-accent-lime/10 transition-colors"
                >
                  Edit
                </button>

                  <button
                    onClick={() => onDelete?.(meeting.id)}
                    className="flex-1 border border-red-500 text-red-400 text-xs font-semibold py-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

          );
        })
      )}
    </div>
  );
};
