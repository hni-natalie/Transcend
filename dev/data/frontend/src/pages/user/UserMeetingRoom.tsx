import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RoomContext } from '@livekit/components-react';
import { ROUTE_PATH as R } from '@config/routes.manifest';
import { useLiveKit, VideoConference } from '@/features/livekit';
import { PageHeader, IconMeetings } from '@/shared';
import { meetingApi } from '@/features/meetings/api/meeting.api';
import { Room, RoomEvent } from 'livekit-client';
import '@livekit/components-styles';

export function UserMeetingRoom({
  headerIcon=<IconMeetings className="w-7 h-7" />,
} : {
  headerIcon?: React.ReactNode;
}) {
  const [room, setRoom] = useState<Room | null>(null);
  const [recordingStatus, setRecordingStatus] = useState('');
  const [hasConnected, setHasConnected] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const {
    meetId,
    roomName,
    meetingTitle,
    isHost,
    leaveTo,
  } = location.state || {
    roomName: '',
    meetId: '',
    meetingTitle: 'Meeting',
    isHost: false,
    leaveTo: R.USER_MEETINGS,
  };

  const {
    isConnectedRoom,
    getLivekitRoom,
    disconnect,
    isLoading,
    error,
  } = useLiveKit(roomName);

  /*
   * Set room when LiveKit connects
   */
  useEffect(() => {
    if (!isConnectedRoom) return;

    setHasConnected(true);
    setRoom(getLivekitRoom());
  }, [isConnectedRoom, getLivekitRoom]);

  /*
   * Redirect to User Meetings when the room disconnects
   */
  useEffect(() => {
    if (!hasConnected || isConnectedRoom) return;

    const handleDisconnected = async () => {
      try {
        /*
         * If the host gets disconnected unexpectedly,
         * end the meeting before navigating away.
         */
        if (isHost) {
          await meetingApi.endMeeting(roomName);
          console.log('Meeting ended after disconnect');
        }
      } catch (error) {
        console.error(
          'Failed to end meeting after disconnect:',
          error
        );
      } finally {
        sessionStorage.removeItem('activeMeeting');

        navigate(leaveTo, { replace: true });
      }
    };

    handleDisconnected();
  }, [
    hasConnected,
    isConnectedRoom,
    isHost,
    roomName,
    navigate,
    leaveTo,
  ]);

  /*
   * Redirect immediately if there is a connection error
   */
  useEffect(() => {
    if (!error) return;

    const handleError = async () => {
      try {
        /*
         * If the host failed to connect / encountered
         * a connection error, end the meeting before
         * navigating away.
         */
        if (isHost) {
          await meetingApi.endMeeting(roomName);
          console.log('Meeting ended after connection error');
        }
      } catch (error) {
        console.error(
          'Failed to end meeting after connection error:',
          error
        );
      } finally {
        sessionStorage.removeItem('activeMeeting');

        navigate(leaveTo, { replace: true });
      }
    };

    handleError();
  }, [
    error,
    isHost,
    roomName,
    navigate,
    leaveTo,
  ]);

  /*
   * Clear active meeting when browser goes offline
   */
  useEffect(() => {
    const handleOffline = () => {
      sessionStorage.removeItem('activeMeeting');
    };

    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /*
   * Listen for recording status changes
   */
  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array) => {
      try {
        const message = JSON.parse(
          new TextDecoder().decode(payload)
        );

        if (message.type === 'RECORDING_STARTED') {
          setRecordingStatus('🔴 Recording started');
        }

        if (message.type === 'RECORDING_STOPPED') {
          setRecordingStatus('');
        }
      } catch (error) {
        console.error(
          'Failed to parse LiveKit data:',
          error
        );
      }
    };

    room.on(RoomEvent.DataReceived, handleData);

    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room]);

  /*
   * Check recording status when entering the meeting
   */
  useEffect(() => {
    if (!meetId) return;

    const checkRecording = async () => {
      try {
        const response =
          await meetingApi.getRecordingStatus(meetId);

        console.log(
          'Recording status response:',
          response
        );

        const isRecording =
          response.status?.status === 'active' ||
          response.status?.status === 'starting';

        setRecordingStatus(
          isRecording
            ? '🔴 Recording started'
            : ''
        );
      } catch (error) {
        console.error(
          'Failed to get recording status:',
          error
        );
      }
    };

    checkRecording();
  }, [meetId]);

  /*
   * Leave meeting manually
   */
  const handleLeave = async () => {
    try {
      /*
       * Host ends the meeting first
       */
      if (isHost) {
        await meetingApi.endMeeting(roomName);
        console.log('Meeting ended');
      }

      sessionStorage.removeItem('activeMeeting');

      /*
       * Disconnect LiveKit
       */
      await disconnect(true);

      /*
       * Navigate after the meeting has been ended
       * and LiveKit has been disconnected.
       */
      navigate(leaveTo, { replace: true });

    } catch (error) {
      console.error(
        'Failed to leave meeting:',
        error
      );

      sessionStorage.removeItem('activeMeeting');

      /*
       * Still navigate even if ending/disconnecting fails.
       */
      navigate(leaveTo, { replace: true });
    }
  };

  return (
    <div className="flex flex-col h-full">

      <PageHeader
        icon={headerIcon}
        title={meetingTitle}
        action={
          isConnectedRoom && (
            <button
              onClick={handleLeave}
              disabled={isLoading}
              className="btn-header"
            >
              Leave Meeting
            </button>
          )
        }
      />

      <div className="flex flex-1 min-h-0 min-w-0 flex-col">

        {recordingStatus && (
          <div className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 font-medium border-b">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />

            {recordingStatus}
          </div>
        )}

        <div className="flex flex-1 min-h-0 justify-center items-center">

          {room && (
            <RoomContext.Provider value={room}>
              <VideoConference
                meetId={meetId}
                isHost={isHost}
                onRecordingChange={(isRecording) => {
                  setRecordingStatus(
                    isRecording
                      ? '🔴 Recording started'
                      : ''
                  );
                }}
              />
            </RoomContext.Provider>
          )}

        </div>
      </div>
    </div>
  );
}