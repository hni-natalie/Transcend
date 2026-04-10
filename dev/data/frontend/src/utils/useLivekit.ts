/*
	separate hook logic to link to livekit service
	that generates token
*/

import { useEffect, useState } from 'react';
import livekitService from '../services/livekitService';
import { useSocket } from '../context/ContextSocket';


// export default function useLiveKit( roomName:string , participantName:string ) {
export default function useLiveKit( roomName:string ) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const { enableSocket, joinRoom, leaveRoom } = useSocket();
  useEffect(() => { enableSocket(); }, []);
  
  // Set up handlers when hook mounts
  useEffect(() => {
    const status = livekitService.getConnectionStatus();
    setIsConnected(status.isConnected);
    
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);
    
    livekitService.on('connected', handleConnected);
    livekitService.on('disconnected', handleDisconnected);
    
    return () => {
      livekitService.off('connected', handleConnected);
      livekitService.off('disconnected', handleDisconnected);
    };
  }, []);

  /* 
    calls socket.emit join-room to backend, backend creates room token
    then route back to connectToRoom in livekitService, create Room() in frontend
  */
  const connect = () => {
    joinRoom(roomName);
    setIsMuted(livekitService.audioManager.getMuteState());
  };

  const disconnect = () => {
    leaveRoom(roomName);
    livekitService.disconnectFromRoom();
  };

  const toggleMute = () => {
    const status = livekitService.audioManager.toggleMute();
    setIsMuted(status)
  }

  return { connect, disconnect, isConnected, isMuted, toggleMute };
}

/*
	usecase:
	const { connect, disconnect, isConnected } = useLiveKit('myroom', 'user123');
*/
