import { useMemo } from 'react';
import { ButtonVoiceRoom } from '@/features/livekit/components/ButtonVoiceRoom';
import { EmptyCard } from '@shared';
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
  onViewRecording?: (id: string) => void;
  onViewChat?: (id: string) => void;
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
  userId,
  onTogglePin,
  onViewMore,
  onDelete,
  onEdit,
  onViewRecording,
  onViewChat,
}: Props) => {
  const sortedMeetings = useMemo(() => {
    return [...meetings].sort(
      (a, b) => Number(b.pinned) - Number(a.pinned)
    );
  }, [meetings]);

  return (
    <div>
      {/* Tab Header */}
      <div className="task-tab">
        <h2 className="text-lg">
          {label}
        </h2>

        <span className="text-2xl text-accent-lime">
          {meetings.length}
        </span>
      </div>

      {/* Empty State or Show Card */}
      <div className="space-y-6">
      {sortedMeetings.length === 0 ? (
        <EmptyCard 
          title='No meetings'
          desc='Nothing scheduled here yet'
        />
      ) : (
        sortedMeetings.map((meeting) => {
          const meetTitle = truncateWords(meeting.title, 3);
          const isHost = meeting.createdByUserId === userId;

          return (
            <div
              key={meeting.id}
              className="task-card"
            >
              {/* Title + Pin */}
              <div className="flex justify-between items-start mb-0.5">
                <h2 className="text-xl font-semibold mb-4 pr-8">
                  {meetTitle}
                </h2>

                <button
                  onClick={() => onTogglePin?.(meeting.id)}
                  className="text-text-tertiary hover:text-text-secondary transition"
                >
                  <IconPin
                    className="w-5 h-5 cursor-pointer"
                    active={meeting.pinned}
                  />
                </button>
              </div>

              {/* Description */}
              <p className="task-desc">
                {truncateWords(meeting.description, 8)}
              </p>

              {/* Meta */}
              <div className="flex flex-col gap-1 mb-2">
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <IconCalendar className="w-4.5 h-4.5" />
                  {meeting.date}
                </div>

                <div className="flex items-center gap-1.5 text-text-secondary">
                  <IconClock className="w-4.5 h-4.5" />
                  {meeting.time} · {meeting.duration}
                </div>

                <div className="flex items-center gap-1.5 text-text-secondary">
                  <IconUsers className="w-4.5 h-4.5" />
                  {meeting.participants} participants
                </div>
              </div>

              {/* View More */}
              <button
                onClick={() => onViewMore?.(meeting.id)}
                className="text-sm text-accent-lime font-medium mb-4 hover:underline"
              >
                View more
              </button>

              {/* Actions */}
              <div>
              {action === 'join' ? (
                meeting.status === "started" ? (
                  <ButtonVoiceRoom
                    joinText={isHost ? "Start Meeting" : "Join Meeting"}
                    roomName={meeting.id}
                    meetingTitle={meeting.title}
                    meetId={meeting.id}
                    mode="video"
                    joinTo={R.USER_VIDEOCALL}
                    isHost={isHost}
                    className="btn-header"
                  />
                ) : isHost ? (
                  <ButtonVoiceRoom
                    joinText="Start Meeting"
                    roomName={meeting.id}
                    meetingTitle={meeting.title}
                    meetId={meeting.id}
                    mode="video"
                    joinTo={R.USER_VIDEOCALL}
                    isHost={true}
                    className="btn-header"
                  />
                ) : (
                  <button
                    disabled
                    className="btn-gray"
                  >
                    Waiting for host
                  </button>
                )
              ) : action === 'transcript' ? (
                <div className="flex gap-2">
                  <button
                      onClick={() => onViewRecording?.(meeting.id)}
                      className='btn-orange'
                  >
                      Recordings
                  </button>

                  <button
                      onClick={() => onViewChat?.(meeting.id)}
                      className='btn-header'
                  >
                      Chat
                  </button>
              </div>
              ) : (
                <div className="flex gap-2">
                  <ButtonVoiceRoom 
                    className='btn-header' 
                    joinText='Start Meeting' 
                    roomName={meeting.id} 
                    meetId={meeting.id}
                    meetingTitle={meeting.title} 
                    mode='video' 
                    joinTo={`${R.USER_VIDEOCALL}`}
                    isHost={true}
                  />

                <button 
                  onClick={() => onEdit?.(meeting.id)}
                  className="btn-header"
                >
                  Edit
                </button>

                  <button
                    onClick={() => onDelete?.(meeting.id)}
                    className="btn-danger-outline-s"
                  >
                    Delete
                  </button>
                </div>
              )}
              </div>
            </div>

          );
        })
      )}
      </div>
    </div>
  );
};
