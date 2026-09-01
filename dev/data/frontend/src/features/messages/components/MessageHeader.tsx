import React, { useEffect, useState } from 'react';
import { IconInfo, IconMeetingAdd, IconPhone, IconProfile, IconVideo } from '@shared';
import type { Profile } from '../types';
import { formatClockTime } from '../lib/format';
import { ChatAvatar } from './ChatAvatar';
import { ButtonVoiceRoom } from '@/features/livekit';
import { ROUTE_PATH as R } from '@config/routes.manifest';

export const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => (
  <div className="relative group">
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
  const [localTime, setLocalTime] = useState(() => formatClockTime());

  useEffect(() => {
    const interval = setInterval(() => setLocalTime(formatClockTime()), 60000);

    return () => clearInterval(interval);
  }, []);

  // KIV : to implement?
  // TO DO: hook this up to a real "create meeting" call
  // (e.g. POST /meetings { conversationId }) once calendar/meeting integration exists
  const handleScheduleMeeting = () => {
    console.log('Schedule meeting for group:', contact.name);
  };

  // console.log('DEBUGG directKey: ', directKey);
  return (
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
        {!contact.isGroup && (
          <>
            {/* KIV: if too complicated, can take these features out */}
            <Tooltip text="Call">
              <div
                aria-label="Call"
                className="flex p-1.5 rounded-lg cursor-pointer transition-colors"
              >
                <ButtonVoiceRoom
                  mode="call"
                  className='border-0 cursor-pointer hover:text-foreground'
                  roomName={`${directKey ?? 'room'}:voice`}
                  joinText={<IconPhone className="stroke-currentColor hover:text-foreground w-[19px] h-[19px]" />}
                  leaveText={<IconPhone className="stroke-currentColor hover:text-foreground text-danger w-[19px] h-[19px] rotate-135" />}
                  loadingText=' '
                />
              </div>
            </Tooltip>

            <Tooltip text="Video Call">
              <div
                aria-label="Video call"
                className="flex p-1.5 rounded-lg cursor-pointer hover:text-foreground transition-colors"
              >
                <ButtonVoiceRoom
                  mode="video"
                  joinText={<IconVideo className="cursor-pointer stroke-currentColor w-[22px] h-[22px]" />}
                  roomName={`${directKey ?? 'room'}:video`}
                  meetingTitle={`Call with ${contact.name}`}
                  // meetId={meeting.id}
                  joinTo={R.USER_VIDEOCALL}
                  leaveTo={R.USER_MESSAGES}
                  className="border-0"
                />
              </div>
            </Tooltip>
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
		{/* KIV  */}

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
  );
}