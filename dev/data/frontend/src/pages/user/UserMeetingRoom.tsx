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

  const { isConnectedRoom, getLivekitRoom, disconnect, isLoading } =
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
          isConnectedRoom && (
            <button
              onClick={handleLeave}
              disabled={isLoading}
              className="btn-lime-outline"
            >
              Leave Meeting
            </button>
          )
        }
      />

      <div className="flex items-center justify-center h-full overflow-y-auto">
        {!room ? (
          <p className="text-foreground-3">
            Connecting to meeting...
          </p>
        ) : (
          <RoomContext.Provider value={room}>
            <VideoConference className="flex h-full w-full justify-center" />
          </RoomContext.Provider>
        )}
      </div>
    </div>
  );
}