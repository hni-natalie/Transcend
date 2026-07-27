/*
 handles voice room joining request, leave room request & mute/unmute
*/

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveKit } from "@features/livekit";
import { IconMute, IconSpeak } from "@shared/ui/Icons";
import { useSocket } from "@/context/SocketContext";
import { ButtonLoading } from "@/shared/ui/ButtonLoading";
import { LivekitMode } from "@/shared/types/livekit.types";
import { meetingApi } from "@/features/meetings/api/meeting.api";

type ButtonVoiceRoomProps = {
  joinText?: string;
  leaveText?: string;
  roomName?: string;
  meetingTitle?: string;
  allowLeave?: boolean;
  mode?: LivekitMode;
  className?: string;
  joinTo?: string;
  leaveTo?: string;
  showMute?: boolean;
  isHost?: boolean;
};

export function ButtonVoiceRoom({
  joinText = "Join Room",
  leaveText = "Leave Room",
  roomName = "myroom",
  meetingTitle = "",
  allowLeave = true,
  mode = "call",
  className = "",
  showMute = true,
  joinTo,
  leaveTo,
  isHost = false,
}: ButtonVoiceRoomProps) {
  const {
    connect,
    disconnect,
    isConnectedRoom,
    currentRoomName,
    isLoading,
    isMuted,
    toggleMute,
  } = useLiveKit(roomName);

  const { enableSocket, isConnected, localPlayerId } = useSocket();
  const navigate = useNavigate();
  const isClicked = useRef(false);
  const hasNavigated = useRef(false);
  const selectedMeeting = useRef({ roomName, meetingTitle });
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => { enableSocket(); }, []);

  const isCurrentRoom = isConnectedRoom && currentRoomName === roomName;

  const handleJoin = async () => {
    console.log("🔥 Start button clicked");

    isClicked.current = true;

    selectedMeeting.current = {
      roomName,
      meetingTitle,
    };

    if (isHost) {
      await meetingApi.startMeeting(roomName);
      console.log("Meeting status changed to started");
    }

    console.log("Selected meeting:", selectedMeeting.current);

    setIsJoining(true);

    const {
      roomName: selectedRoomName,
      meetingTitle: selectedMeetingTitle,
    } = selectedMeeting.current;

    console.log("✅ LiveKit connected, navigating to", {
      selectedRoomName,
      selectedMeetingTitle,
    });

    navigate(joinTo!, {
        state: {
          roomName: selectedRoomName,
          meetingTitle: selectedMeetingTitle,
          isHost: isHost,
        },
      });

    await connect(mode);

    console.log("Waiting for LiveKit connection...");
  };

  const handleLeave = async () => {
    setIsLeaving(true);
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

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const finalClassName = className || "btn-lime-outline";

  return (
    <nav className="flex justify-center items-center">
      {!isCurrentRoom ? (
        <button
          onClick={handleJoin}
          className={finalClassName}
          disabled={!isConnected || isJoining}
        >
          {isJoining ? (
            <ButtonLoading isLoading={isJoining} />
          ) : (
            joinText
          )}
        </button>
      ) : (
        <div className="flex gap-4">
          {allowLeave && (
            <button
              onClick={handleLeave}
              disabled={ isLoading || isLeaving }
              className={`${finalClassName} flex-1`}
            >
              {isLeaving ? (
                <ButtonLoading isLoading={isLeaving} />
              ) : (
                leaveText
              )}
            </button>
          )}

          {showMute && (
            <button
              onClick={toggleMute}
              disabled={ isLoading || isLeaving }
              className={`${isMuted ? "btn-outline" : finalClassName} rounded-full transition-colors duration-500 p-1`}
            >
              {isMuted ? (
                <IconMute className="w-4 h-4 text-border-2" />
              ) : (
                <IconSpeak className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}