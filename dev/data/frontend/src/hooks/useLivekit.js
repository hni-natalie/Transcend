/*
	separate hook logic to link to livekit service
	that generates token
*/

import { useEffect, useState } from 'react';
import livekitService from '../services/livekitService';

export const useLiveKit = (roomName, participantName) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if already connected when hook mounts
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

  const connect = async () => {
    // Service handles token caching internally
    return await livekitService.connectToRoom(roomName, participantName);
  };

  const disconnect = () => {
    livekitService.disconnectFromRoom();
  };

  return { connect, disconnect, isConnected };
};

/*
	usecase:
	const { connect, disconnect, isConnected } = useLiveKit('myroom', 'user123');
*/
