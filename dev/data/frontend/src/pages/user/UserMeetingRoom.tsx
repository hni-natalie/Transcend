import { useEffect, useState, useCallback } from 'react';
import { ROUTE_PATH as R } from '@config/routes.manifest';
import { useLocation } from 'react-router-dom';
import { Track } from 'livekit-client';
import { useMemo } from 'react';
import { RoomContext, ParticipantTile, useTracks } from '@livekit/components-react';
import { ButtonVoiceRoom, useLiveKit, VideoConference } from '@/features/livekit';
import { PageHeader, IconMeetings } from '@/shared';
import '@livekit/components-styles';

// function VideoConferenceUI() {
//   const tracks = useTracks([
//     { source: Track.Source.Camera, withPlaceholder: true },
//     { source: Track.Source.ScreenShare, withPlaceholder: false },
//   ]);

//   return (
//     <div className="grid grid-cols-2 gap-4 p-4">
//       {tracks.map((track) => (
//         <ParticipantTile key={track.participant.identity} trackRef={track} />
//       ))}
//     </div>
//   );
// }

export function UserMeetingRoom() {
  const [room, setRoom] = useState(null);
  const location = useLocation();
  const { roomName } = location.state || 'Default Meeting';
  // const roomName = '42 Transcend Discussion'
  const { isConnectedRoom, getLivekitRoom } = useLiveKit(roomName);

  console.log('[UserMeetingRoom] room: ', roomName);
  useEffect(() => {
    if (!isConnectedRoom) return ;
    const livekitRoom = getLivekitRoom();
    setRoom(livekitRoom);

  }, [isConnectedRoom])

  useEffect(() => {
    if (!room) return ;
    console.log('Room exists!!!!');

  }, [room])
  return (
  <>
  	<div className='flex flex-col h-full'>

      <PageHeader 
      icon={<IconMeetings className="w-7 h-7" />}
      title={roomName}
      action={
        <ButtonVoiceRoom 
          roomName={roomName} 
          joinText={`Join ${roomName}`}
          leaveTo={R.USER_MEETINGS}
          showMute={false}
          mode="video"
        />
      }
      />
      <div className="flex items-center justify-center h-full overflow-y-auto">
      {!room ? (
          <p className="text-foreground-3">Vid meetings coming soon...</p>
        ) : (
        <RoomContext.Provider value={room}>
          <VideoConference className='flex h-full w-full justify-center'/>
        </RoomContext.Provider>
      )}
      </div>
    </div>
  </>
  );
}