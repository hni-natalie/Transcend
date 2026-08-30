import { useState } from 'react';
import { IconRecording } from '@/shared';
import { meetingApi } from '@/features/meetings/api/meeting.api';
import { useRoomContext } from '@livekit/components-react';

interface RecordingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  meetId: string;
}

export function RecordingButton({ meetId, ...props }: RecordingButtonProps) {
  const room = useRoomContext();

  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleRecording = async () => {
    try {
      setLoading(true);

      if (!isRecording) {
        await meetingApi.startRecording(meetId);
        setIsRecording(true);

        await room.localParticipant.publishData(
        new TextEncoder().encode(
          JSON.stringify({
            type: 'RECORDING_STARTED',
          })
        ),
        { reliable: true, }
      );

        return;
      }

      await meetingApi.stopRecording(meetId);
      setIsRecording(false);

      await room.localParticipant.publishData(
        new TextEncoder().encode(
          JSON.stringify({
            type: 'RECORDING_STOPPED',
          })
        ),
        { reliable: true, }
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
      <IconRecording
        className={`w-6 h-6 ${isRecording ? 'recording-active' : ''}`}
      />

      <span>
        {isRecording ? 'Stop Recording' : 'Record'}
      </span>
    </button>
  );
}