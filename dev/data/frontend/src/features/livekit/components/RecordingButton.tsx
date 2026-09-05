import { useEffect, useState } from 'react';
import { IconRecording, IconRecordingStop } from '@/shared';
import { meetingApi } from '@/features/meetings/api/meeting.api';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

interface RecordingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  meetId: string;
  showText: boolean;
  onRecordingChange?: (isRecording: boolean) => void;
}

export function RecordingButton({
  meetId,
  showText,
  onRecordingChange,
  ...props
}: RecordingButtonProps) {
  const room = useRoomContext();

  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkRecording = async () => {
      try {
        const response = await meetingApi.getRecordingStatus(meetId);

        const recording =
          response.status?.status === 'active' ||
          response.status?.status === 'starting';

        setIsRecording(recording);
        onRecordingChange?.(recording);
      } catch (error) {
        console.error('Failed to get recording status:', error);
      }
    };

    if (meetId) {
      checkRecording();
    }
  }, [meetId, onRecordingChange]);

  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      const message = JSON.parse(
        new TextDecoder().decode(payload)
      );

      if (message.type === 'RECORDING_STARTED') {
        setIsRecording(true);
        onRecordingChange?.(true);
      }

      if (message.type === 'RECORDING_STOPPED') {
        setIsRecording(false);
        onRecordingChange?.(false);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);

    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, onRecordingChange]);

  const toggleRecording = async () => {
    try {
      setLoading(true);

      if (!isRecording) {
        await meetingApi.startRecording(meetId);

        setIsRecording(true);
        onRecordingChange?.(true);

        await room.localParticipant.publishData(
          new TextEncoder().encode(
            JSON.stringify({
              type: 'RECORDING_STARTED',
            })
          ),
          { reliable: true },
        );

        return;
      }

      await meetingApi.stopRecording(meetId);

      setIsRecording(false);
      onRecordingChange?.(false);

      await room.localParticipant.publishData(
        new TextEncoder().encode(
          JSON.stringify({
            type: 'RECORDING_STOPPED',
          })
        ),
        { reliable: true },
      );

    } catch (error) {
      console.error('Recording error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="lk-button"
      onClick={toggleRecording}
      disabled={loading}
      {...props}
    >
      {isRecording ? (
        <IconRecordingStop className="w-6 h-6" />
      ) : (
        <IconRecording className="w-6 h-6" />
      )}

      <span>
        {showText && (isRecording ? 'Stop Recording' : 'Record')}
      </span>
    </button>
  );
}
