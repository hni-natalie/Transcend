import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RoomContext } from '@livekit/components-react';
import { ROUTE_PATH as R } from '@config/routes.manifest';
import { useLiveKit, VideoConference } from '@/features/livekit';
import { PageHeader, IconMeetings } from '@/shared';
import { useAuth } from '@/features/auth/AuthContext';
import { meetingApi } from '@/features/meetings/api/meeting.api';
import '@livekit/components-styles';

export function UserMeetingRoom() {
  const [room, setRoom] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  // console.log("location state:", location.state);
  
  const { meetId, roomName, meetingTitle, isHost } = location.state || {
    roomName: '',
    meetId: '',
    meetingTitle: 'Meeting',
    isHost: false,
  };

  const { isConnectedRoom, getLivekitRoom, disconnect, isLoading, error } =
    useLiveKit(roomName);

  const { user } = useAuth();

  useEffect(() => {
    if (!isConnectedRoom) return;
    setRoom(getLivekitRoom());
  }, [isConnectedRoom, getLivekitRoom]);

  useEffect(() => {
    if (room) console.log('Room exists!');
  }, [room]);

  const handleLeave = async () => {
    await disconnect(true);

    if (isHost) {
      await meetingApi.endMeeting(roomName);
      console.log("Meeting ended");
    }

    navigate(R.USER_MEETINGS);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        icon={<IconMeetings className="w-7 h-7" />}
        title={meetingTitle}
        action={
          error ? (
            <button
              onClick={() => navigate(R.USER_MEETINGS)}
              className="btn-lime-outline"
            >
              Return Back
            </button>
          ) : (
            isConnectedRoom && (
              <button
                onClick={handleLeave}
                disabled={isLoading}
                className="btn-lime-outline"
              >
                Leave Meeting
              </button>
            )
          )
        }
      />

      <div className="flex flex-1 min-h-0 min-w-0">
        {error ? (
          <div className="text-center">
            <p className="text-red-500 font-semibold">
              Failed to join meeting
            </p>

            <p>{error}</p>
          </div>
        ) : !room ? (
          <p>Connecting...</p>
        ) : (
          <RoomContext.Provider value={room}>
            <VideoConference meetId={meetId}/>
          </RoomContext.Provider>
        )}
      </div>
    </div>
  );
}