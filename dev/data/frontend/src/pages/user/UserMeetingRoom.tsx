import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RoomContext } from '@livekit/components-react';
import { ROUTE_PATH as R } from '@config/routes.manifest';
import { useLiveKit, VideoConference } from '@/features/livekit';
import { PageHeader, IconMeetings } from '@/shared';
import '@livekit/components-styles';

export function UserMeetingRoom() {
  const [room, setRoom] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  console.log("location state:", location.state);
  
  const { roomName, meetingTitle } = location.state || {
    roomName: '',
    meetingTitle: 'Meeting',
  };

  const { isConnectedRoom, getLivekitRoom, disconnect, isLoading, error } =
    useLiveKit(roomName);

  useEffect(() => {
    if (!isConnectedRoom) return;
    setRoom(getLivekitRoom());
  }, [isConnectedRoom, getLivekitRoom]);

  useEffect(() => {
    if (room) console.log('Room exists!');
  }, [room]);

  const handleLeave = async () => {
    await disconnect(true);
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

      <div className="flex items-center justify-center h-full">
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
            <VideoConference />
          </RoomContext.Provider>
        )}
      </div>
    </div>
  );
}