import { useState } from 'react';
import { IconRecording } from '@/shared';
import { meetingApi } from '@/features/meetings/api/meeting.api';

interface RecordingButtonProps { meetId: string; }

export function RecordingButton({ meetId }: RecordingButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleRecording = async () => {
    try {
      setLoading(true);

      if (!isRecording) {
        await meetingApi.startRecording(meetId);
        setIsRecording(true);
        return;
      }

      await meetingApi.stopRecording(meetId);
      setIsRecording(false);

    } catch (error) {
      console.error('Recording error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="lk-button flex items-center gap-2"
      onClick={toggleRecording}
      disabled={loading}
    >
      <IconRecording
        className={isRecording ? 'recording-active' : ''}
      />

      <span>
        {isRecording ? 'Stop Recording' : 'Record'}
      </span>
    </button>
  );
}