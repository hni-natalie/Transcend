/*
 handles voice room joining request, leave room request & mute/unmute
*/

import { useState, useEffect } from "react";
import useLiveKit from '../utils/useLivekit'
import { IconMute, IconSpeak } from '../config/menu.icons.conf';
import { useSocket } from '../context/ContextSocket';
import Loading from "./BtnLoading";

export default function ButtonVoiceRoom( { roomName='myroom', allowLeave=true } ) {
  const { connect, disconnect, isConnectedRoom, isLoading, isMuted, toggleMute, joinCount } = useLiveKit(roomName);
  const { enableSocket, isConnected, localPlayerId, socket } = useSocket();
  useEffect(() => { enableSocket(); }, []);
  

  useEffect(() => {
    console.log('FE lk Connection status: ', isConnectedRoom);
  }, [isConnectedRoom]);

  const handleJoin = async () => {
    connect();
  };

  const handleLeave = () => {
    console.log('ppppikaa!')
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
    <nav className="flex justify-center">
      {!isConnectedRoom ? (
        <div>
          <button onClick={handleJoin} className="btn-lime-outline">
            {isLoading 
            ? <Loading isLoading={isLoading}/>
            : `Connect ${roomName} Audio `}
          </button>
        </div>
      ) : (
        <div className="flex gap-4 items-center">
          {allowLeave && (<button onClick={handleLeave} className="btn-lime-outline">Disconnect Audio</button>)}
          {/* button with mute/unmute icon */}
          <button onClick={toggleMute} className={`${isMuted ? 'btn-outline' : 'btn-lime-outline'} rounded-full transition-colors duration-500 p-1`}>{ isMuted ? <IconMute className="w-4 h-4 text-brand-gray-500"/> : <IconSpeak className="w-4 h-4"/> }</button>
        </div>
      )}
    </nav>
  )
}