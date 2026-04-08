/*
	separate hook logic to link to livekit service
	that generates token
*/

import { useEffect, useState } from 'react';
import livekitService from '../services/livekitService';

export default function useLiveKit( roomName:string , participantName:string ) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

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
    // Service handles token caching internally
    const result = await livekitService.connectToRoom(roomName, participantName);
    setIsMuted(livekitService.audioManager.getMuteState());
    return result
  };

  const disconnect = () => {
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
