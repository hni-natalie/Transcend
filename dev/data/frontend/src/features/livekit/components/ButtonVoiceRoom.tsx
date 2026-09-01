/*
 handles voice room joining request, leave room request & mute/unmute
*/

import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveKit } from "@features/livekit";
import { IconMic, IconMicDisabled } from "@shared/ui/Icons";
import { useSocket } from "@/context/SocketContext";
import { ROUTE_PATH as R } from '@config/routes.manifest';
import { ButtonLoading } from "@/shared/ui/ButtonLoading";
import { LivekitMode } from "@/shared/types/livekit.types";
import { meetingApi } from "@/features/meetings/api/meeting.api";

type ButtonVoiceRoomProps = {
  joinText?: React.ReactNode;
  leaveText?: React.ReactNode;
  loadingText?: string;
  roomName?: string;
  meetingTitle?: string;
  allowLeave?: boolean;
  mode?: LivekitMode;
  className?: string;
  joinTo?: string;
  leaveTo?: string;
  showMute?: boolean;
  isHost?: boolean;
  meetId?: string;
};

export function ButtonVoiceRoom({
  joinText = "Join Room",
  leaveText = "Leave Room",
  loadingText = "Loading",
  roomName = "myroom",
  meetingTitle = "",
  allowLeave = true,
  mode = "call",
  className = "",
  showMute = true,
  joinTo,
  leaveTo,
  isHost = false,
  meetId = "",
}: ButtonVoiceRoomProps) {
  const {
    connect,
    disconnect,
    isConnectedRoom,
    currentRoomName,
    isCurrentLoading,
    isLoading,
    isMuted,
    toggleMute,
  } = useLiveKit(roomName);

  const { enableSocket, isConnected, localPlayerId } = useSocket();
  const navigate = useNavigate();
  const isClicked = useRef(false);
  const hasNavigated = useRef(false);
  const selectedMeeting = useRef({ roomName, meetId, meetingTitle });

  useEffect(() => { enableSocket(); }, []);

  const isCurrentRoom = isConnectedRoom && currentRoomName === roomName;

  const handleJoin = async () => {
    console.log("🔥 Start button clicked");

    isClicked.current = true;

    selectedMeeting.current = {
      roomName,
      meetId,
      meetingTitle,
    };

    if (isHost) {
      await meetingApi.startMeeting(roomName);
      console.log("Meeting status changed to started");
    }

    console.log("Selected meeting:", selectedMeeting.current);

    const {
      roomName: selectedRoomName,
      meetId: selectedMeetId,
      meetingTitle: selectedMeetingTitle,
    } = selectedMeeting.current;

    console.log("✅ LiveKit connected, navigating to", {
      selectedRoomName,
      selectedMeetId,
      selectedMeetingTitle,
    });

    if (joinTo) {
      navigate(joinTo, {
          state: {
            roomName: selectedRoomName,
            meetingTitle: selectedMeetingTitle,
            meetId: selectedMeetId,
            isHost: isHost,
            leaveTo: leaveTo || R.USER_MEETINGS,
          },
        });
    }

    await connect(mode);

    console.log("Waiting for LiveKit connection...");
  };

  const handleLeave = async () => {
    isClicked.current = false;
    hasNavigated.current = false;

    if (isHost) {
      await meetingApi.endMeeting(roomName);
      console.log("Meeting status changed to scheduled");
    }
  
    await disconnect(true);
  
    if (leaveTo) navigate(leaveTo);
  };

  const handleBeforeUnload = async () => {
    await disconnect(false);
  };

  // cleanup when page refresh/close
  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const finalClassName = className || "btn-lime-outline";

  return (
    <nav className="flex items-center">
      {!isCurrentRoom ? (
        <button
          onClick={handleJoin}
          className={finalClassName}
          disabled={!isConnected || isCurrentLoading}
        >
          {isCurrentLoading ? (
            <ButtonLoading isLoading={isCurrentLoading} />
          ) : (
            joinText
          )}
        </button>
      ) : (
        <div className="flex gap-4">
          {allowLeave && (
            <button
              onClick={handleLeave}
              disabled={ isCurrentLoading }
              className={`${finalClassName} flex-1`}
            >
              {isCurrentLoading ? (
                <ButtonLoading isLoading={isCurrentLoading} text={loadingText} />
              ) : (
                leaveText
              )}
            </button>
          )}

          {showMute && (
            <button
              onClick={toggleMute}
              disabled={ isCurrentLoading }
              className={`${isMuted ? "btn-outline" : finalClassName} rounded-full transition-colors duration-500 p-1`}
            >
              {isMuted ? (
                <IconMicDisabled className="w-4 h-4 text-border-2" />
              ) : (
                <IconMic className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}