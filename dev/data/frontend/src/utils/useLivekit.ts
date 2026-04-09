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
  // Check if connection status when hook mounts

  useEffect(() => {
    const status = livekitService.getConnectionStatus();
    // console.log('Livekit service status:', status);
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

  const connect = async () => {
  //   // Service handles token caching internally
  //   // const result = await livekitService.connectToRoom(roomName);
  //   const result = joinRoom(roomName);
    // setIsMuted(livekitService.audioManager.getMuteState());
    //   return result
    joinRoom(roomName);
    setIsMuted(livekitService.audioManager.getMuteState());
  };

  const disconnect = () => {
    livekitService.disconnectFromRoom();
    leaveRoom(roomName);
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
