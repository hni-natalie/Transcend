import React, { useEffect, useState, useMemo } from 'react';
import { IconInfo, IconMeetingAdd, IconPhone, IconProfile, IconVideo, LoadingState, StateText, UserCallStatus } from '@shared';
import type { Profile } from '../types';
import { formatClockTime } from '../lib/format';
import { ChatAvatar } from './ChatAvatar';
import { ButtonVoiceMsg } from '@/features/livekit';
import { ROUTE_PATH as R } from '@config/routes.manifest';
import { useSocket } from '@/context/SocketContext';
import { ScheduleMeetingModal } from '@/features/meetings';

export const Tooltip = ({ children, text, className }: { children: React.ReactNode; text: string, className?: string }) => (
  <div className={`relative group ${className}`}>
    {children}

    <div className="mt-2.5 absolute top-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 text-base text-white bg-background-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      {text}
    </div>
  </div>
);

interface MessageHeaderProps {
  contact: Profile;
  directKey?: string | null;
  isInfoOpen: boolean;
  onToggleInfo: () => void;
}

export function MessageHeader({ contact, directKey, isInfoOpen, onToggleInfo }: MessageHeaderProps) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [localTime, setLocalTime] = useState(() => formatClockTime());
  const { incomingCalls, callStatus, setCallStatus, isConnected } = useSocket();
  const isRinging = !!directKey && !!incomingCalls[directKey];
  const [callMode, setCallMode] = useState('none');

  useEffect(() => {
    const interval = setInterval(() => setLocalTime(formatClockTime()), 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
	  // if (!incomingCalls) return ;
    if (!incomingCalls || !directKey) return;
    setCallMode(incomingCalls[directKey]?.mode);
  }, [incomingCalls, directKey]);

  const handleScheduleMeeting = () => {
  setShowScheduleModal(true);
  };
  const groupMemberIds = useMemo(
    () =>
      contact.isGroup
        ? contact.members?.map(member => member.id) ?? []
        : [],
    [contact.isGroup, contact.members]
  );

  // console.log('DEBUGG directKey: ', directKey);
  return (
    <>
    <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
      <div className="flex items-center gap-3">
        <ChatAvatar
          size="ml"
          status={contact.isGroup ? undefined : contact.status}
          name={contact.name}
          email={contact.email}
          photo={contact.avatarUrl}
          isGroup={contact.isGroup}
        />

        <div className="min-w-0">
          <p className="text-[14px] text-foreground font-semibold truncate">{contact.name}</p>
          <p className="text-[11px] text-foreground-3 truncate">Local Time {localTime}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-foreground-3">
        {/* {!contact.isGroup && ( */}
		{!contact.isGroup && !contact.deletedAt && (
          <>
            {callStatus.status === 'ringing' && callStatus.directKey === directKey && <LoadingState message='Awaiting' size='none' msgClassName='font-sans'/>}
            {isRinging && callStatus.status === 'connected' && <LoadingState message='Connected' size='none' msgClassName='font-sans animate-none!'/>}

            <Tooltip text={`${isConnected ? 'Call' : 'Refresh to connect'}`}>
              <div
                aria-label="Call"
                className="flex p-1.5 gap-1 rounded-lg transition-colors"
              >
                <ButtonVoiceMsg
                  mode="call"
                  className={`border-0 hover:text-foreground ${isConnected ? 'cursor-pointer' : 'cursor-not-allowed' }`}
                  roomName={`${directKey ?? 'room'}:voice`}
                  directKey={directKey ?? undefined}
                  isInitiator={!isRinging}
                  joinText={
                    <IconPhone
                      className={`stroke-currentColor hover:text-foreground w-[19px] h-[19px] ${
                        isRinging && callStatus.status === 'idle' && callMode === 'call' ? 'animate-bounce' : ''}`
                      }
                    />
                  }
                  leaveText={<IconPhone className="stroke-currentColor hover:text-foreground text-danger w-[19px] h-[19px] rotate-135" />}
                  loadingText=' '
                  onCallStatusChange={(status, dk) => setCallStatus({ status, directKey: dk ?? null })}
                />
              </div>
            </Tooltip>

            {callStatus.status === 'idle' &&
            <Tooltip text={`${isConnected ? 'Video Call' : 'Refresh to connect'}`}>
              <div
                aria-label="Video call"
                className="flex p-1.5 rounded-lg hover:text-foreground transition-colors"
              >
                <ButtonVoiceMsg
                  mode="video"
                  joinText={
                    <IconVideo
                      className={`stroke-currentColor w-[22px] h-[22px] ${isConnected ? 'cursor-pointer' : 'cursor-not-allowed' } ${
                        isRinging && callStatus.status === 'idle' && callMode === 'video' ? 'animate-bounce' : ''}`
                      }
                    />
                  }
                  roomName={`${directKey ?? 'room'}:video`}
                  directKey={directKey ?? undefined}
                  isInitiator={!isRinging}
                  meetingTitle={`Call with ${contact.name}`}
                  // meetId={meeting.id}
                  joinTo={R.USER_VIDEOCALL}
                  leaveTo={R.USER_MESSAGES}
                  className="border-0"
                />
              </div>
            </Tooltip>
            }
          </>
        )}

        {contact.isGroup && (
          <Tooltip text="Schedule Meeting">
            <button
              aria-label="Schedule meeting"
              onClick={handleScheduleMeeting}
              className="flex p-1.5 rounded-lg cursor-pointer hover:text-foreground transition-colors"
            >
              <IconMeetingAdd className="stroke-currentColor w-[19px] h-[19px]" />
            </button>
          </Tooltip>
        )}

        <Tooltip text={contact.isGroup ? 'Group Info' : 'Profile'}>
          <button
            aria-label="Toggle profile"
            onClick={onToggleInfo}
            className={`flex p-1.5 rounded-lg cursor-pointer transition-colors hover:text-foreground ${
              isInfoOpen ? 'text-accent-lime' : ''
            }`}
          >
            {contact.isGroup ? (
              <IconInfo className="stroke-currentColor w-[19px] h-[19px]" />
            ) : (
              <IconProfile className="stroke-currentColor w-[19px] h-[19px]" />
            )}
          </button>
        </Tooltip>
      </div>
    </div>
    {showScheduleModal && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={() => setShowScheduleModal(false)}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <ScheduleMeetingModal
          open={showScheduleModal}
          mode="create"
          initialParticipantIds={groupMemberIds}
          onClose={() => setShowScheduleModal(false)}
          onCreated={() => setShowScheduleModal(false)}
        />
      </div>
    </div>
  )}
    </>
  );
}