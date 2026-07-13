/*
 handles voice room joining request, leave room request & mute/unmute
*/

import { useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useLiveKit } from '@features/livekit'
import { IconMute, IconSpeak } from '@shared/ui/Icons';
import { useSocket } from '@/context/SocketContext';
import { ButtonLoading } from "@/shared/ui/ButtonLoading";
import { LivekitMode } from "@/shared/types/livekit.types";

type ButtonVoiceRoomProps = {
  joinText?: string;
  leaveText?: string;
  roomName?: string;
  allowLeave?: boolean;
  mode?: LivekitMode;
  className?: string;
  joinTo?: string;
  leaveTo?: string;
  showMute?: boolean;
};

export function ButtonVoiceRoom( { joinText='Join Room', leaveText='Leave Room', roomName='myroom', allowLeave=true, mode="call", className='', showMute=true, joinTo, leaveTo } : ButtonVoiceRoomProps) {
  const { connect, disconnect, isConnectedRoom, isLoading, isMuted, toggleMute, joinCount } = useLiveKit(roomName);
  const { enableSocket, isConnected, localPlayerId } = useSocket();
  const navigate = useNavigate();

  useEffect(() => { enableSocket(); }, []);
  
  const handleJoin = async () => {
    if (joinTo) {
      console.log('href destination is set: ', joinTo);
      navigate(joinTo, {
        state: { roomName }
      });
    }
    await connect(mode);
  };
  const handleLeave = async () => {
    await disconnect(true);
    if (leaveTo) {
      console.log('href leaveTo is set: ', leaveTo);
      navigate(leaveTo);
    }
  };
  const handleBeforeUnload = async () => {
    await disconnect(false); //dont show loading icon
  };
  const finalClassName = className || 'btn-lime-outline'


  useEffect(() => {
    if (isConnected)
      console.log('local player id: ', localPlayerId)
  },[isConnected])

  // Clean up when component unmounts
  useEffect(() => {
  return () => {
    disconnect(false); //dont show loading icon
  };
  }, []);

  // cleanup when page refresh/close
  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <nav className="flex justify-center items-center">
      {!isConnectedRoom ? (
        <div>
          <button onClick={handleJoin} className={finalClassName} disabled={!isConnected || isLoading}>
            {isLoading 
            ? <ButtonLoading isLoading={isLoading}/>
            : joinText}
          </button>
        </div>
      ) : (
        <div className="flex gap-4">
          {allowLeave && 
          (<button onClick={handleLeave} disabled={isLoading} className={finalClassName}>
            {leaveText}
          </button>)}
          {/* mute/unmute button */}
          { showMute &&
          <button onClick={toggleMute} disabled={isLoading} className={`${isMuted ? 'btn-outline' : finalClassName} rounded-full transition-colors duration-500 p-1`}>
            { isMuted ? <IconMute className="w-4 h-4 text-border-2"/> : <IconSpeak className="w-4 h-4"/> }
          </button>
          }
        </div>
      )}
    </nav>
  )
}
