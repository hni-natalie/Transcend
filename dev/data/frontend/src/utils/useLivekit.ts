/*
	separate hook logic to link to livekit service
	that generates token
*/

import { useEffect, useState } from 'react';
import livekitService from '../services/livekitService';
import { useSocket } from '../context/ContextSocket';


// export default function useLiveKit( roomName:string , participantName:string ) {
export default function useLiveKit( roomName:string ) {
  const [isConnectedRoom, setIsConnectedRoom] = useState(false);
  const [activePlane, setActivePlane] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const { enableSocket, joinRoom, leaveRoom } = useSocket();
  useEffect(() => { enableSocket(); }, []);

  const [joinCount, setJoinCount] = useState<number>(0);
  const [isLoading, setisLoading] = useState<boolean>(false);

  
  // Set up handlers when hook mounts
  useEffect(() => {
    const status = livekitService.getConnectionStatus();
    setIsConnectedRoom(status.isConnected);
    
    const handleConnected = () => setIsConnectedRoom(true);
    const handleDisconnected = () => {
      setActivePlane(null);
      setIsConnectedRoom(false);
    };
    
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
    setisLoading(true)

    const onSuccess = (event: any) => {
      console.log('Connection complete!', event.detail);
      setJoinCount(prev => prev + 1);
      setisLoading(false);
      window.removeEventListener('livekit-connect-success', onSuccess);
    };
    
    const onError = (event: any) => {
      console.error('Connection failed!', event.detail);
      setisLoading(false);
      window.removeEventListener('livekit-connect-error', onError);
    };
    
    window.addEventListener('livekit-connect-success', onSuccess);
    window.addEventListener('livekit-connect-error', onError);

    joinRoom(roomName);
    setIsMuted(livekitService.audioManager.getMuteState());
  };

  const disconnect = () => {
    leaveRoom(roomName); // emit leave-room signal to backend
    livekitService.disconnectFromRoom(); // frontend cleanup
  };

  const toggleMute = () => {
    const status = livekitService.audioManager.toggleMute();
    setIsMuted(status)
  }

  return { connect, disconnect, isConnectedRoom, isMuted, toggleMute, isLoading, joinCount, activePlane, setActivePlane };
}

/*
	usecase:
	const { connect, disconnect, isConnected } = useLiveKit('myroom', 'user123');
*/
