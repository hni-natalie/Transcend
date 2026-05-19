/*
 handles voice room joining request, leave room request & mute/unmute
*/

import { useState, useEffect } from "react";
import { useLiveKit } from '@features/livekit'
import { IconMute, IconSpeak } from '@shared/ui/Icons';
import { useSocket } from '@/features/socketio/useSocket';
import { ButtonLoading } from "@/shared/ui/ButtonLoading";

export function ButtonVoiceRoom( { joinText='Join Room', leaveText='Leave Room', roomName='myroom', allowLeave=true } ) {
  const { connect, disconnect, isConnectedRoom, isLoading, isMuted, toggleMute, joinCount } = useLiveKit(roomName);
  const { enableSocket, isConnected, localPlayerId, socket } = useSocket();
  useEffect(() => { enableSocket(); }, []);
  
  // debug
  // useEffect(() => {
  //   console.log('FE lk Connection status: ', isConnectedRoom);
  // }, [isConnectedRoom]);

  const handleJoin = async () => {
    connect("call");
  };

  const handleLeave = () => {
    disconnect();
  };

  useEffect(() => {
    if (isConnected)
      console.log('local player id: ', localPlayerId)
  },[isConnected])

  // Clean up when component unmounts
  useEffect(() => {
  return () => {
    handleLeave();
  };
  }, []);

  // cleanup when page refresh/close
  useEffect(() => {
    window.addEventListener('beforeunload', handleLeave);
    return () => {
      window.removeEventListener('beforeunload', handleLeave);
    };
  }, []);

  return (
    <nav className="flex justify-center items-center">
      {!isConnectedRoom ? (
        <div>
          <button onClick={handleJoin} className="btn-lime-outline">
            {isLoading 
            ? <ButtonLoading isLoading={isLoading}/>
            : joinText}
          </button>
        </div>
      ) : (
        <div className="flex gap-4">
          {/* button with mute/unmute icon */}
          {allowLeave && (<button onClick={handleLeave} className="btn-lime-outline">{leaveText}</button>)}
          <button onClick={toggleMute} className={`${isMuted ? 'btn-outline' : 'btn-lime-outline'} rounded-full transition-colors duration-500 p-1`}>{ isMuted ? <IconMute className="w-4 h-4 text-border-2"/> : <IconSpeak className="w-4 h-4"/> }</button>
        </div>
      )}
    </nav>
  )
}
