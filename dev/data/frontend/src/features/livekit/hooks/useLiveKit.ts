/*
	separate hook logic to link to livekit service
	that generates token
*/

import { useEffect, useState } from 'react';
import { livekitService } from '@/features/livekit/services/livekitService';
import { useSocket } from '@/features/socketio/useSocket';
import * as THREE from 'three'; //debug


// export function useLiveKit( roomName:string , participantName:string ) {
export function useLiveKit( roomName:string ) {
  const [isConnectedRoom, setIsConnectedRoom] = useState(false);
  const [activePlane, setActivePlane] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const { enableSocket, joinRoom, leaveRoom } = useSocket();
  useEffect(() => { enableSocket(); }, []);

  const [joinCount, setJoinCount] = useState<number>(0);
  const [isLoading, setisLoading] = useState<boolean>(false);
  const [readyStreams, setReadyStreams] = useState<Set<string>>(new Set());

  
  // Set up handlers when hook mounts
  useEffect(() => {
    const status = livekitService.getConnectionStatus();
    setIsConnectedRoom(status.isConnected);
    
    const handleConnected = (data) => {
      console.log('Connected to room:', data.room);
      setTimeout(() => {
        setIsConnectedRoom(true);
        setisLoading(false);
      }, 3000)
    };
    const handleDisconnected = () => {
      setTimeout(() => {
        setActivePlane(null);
        setIsConnectedRoom(false);
      }, 2000)
    };
    const handleSubscribed = ({ id }) => {
      // console.log("audio-track-subscribed!");
      setReadyStreams(prev => {
        const newSet = new Set(prev);
        newSet.add(id);
        return newSet;
      });
    };
    const handleUnsubscribed = ({ id }) => {
      // console.log("audio-track-unsubscribed!");
      setReadyStreams(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    };
    
    livekitService.on('connected', handleConnected);
    livekitService.on('disconnected', handleDisconnected);
    livekitService.on('audio-track-subscribed', handleSubscribed);
    livekitService.on('audio-track-unsubscribed', handleUnsubscribed);

    return () => {
      livekitService.off('connected', handleConnected);
      livekitService.off('disconnected', handleDisconnected);
      livekitService.off('audio-track-subscribed', handleSubscribed);
      livekitService.off('audio-track-unsubscribed', handleUnsubscribed);
    };
  }, []);

  /* 
    calls socket.emit join-room to backend, backend creates room token
    then route back to connectToRoom in livekitService, create Room() in frontend
  */
const connect = async ( mode: "room" | "call" ) => {

    // const onSuccess = (event: any) => {
    //   console.log('Connection complete!', event.detail);
    //   setJoinCount(prev => prev + 1); // debug

    //   // setTimeout(() => {
    //     // setisLoading(false);
    //   // }, 2000); // 2 second delay
    //   window.removeEventListener('livekit-connect-success', onSuccess);
    // };
    const onError = (event: any) => {
      console.error('Connection failed!', event.detail);
      setisLoading(false);
      window.removeEventListener('livekit-connect-error', onError);
    };
    // window.addEventListener('livekit-connect-success', onSuccess);
    window.addEventListener('livekit-connect-error', onError);


    setisLoading(true)
    setIsMuted(livekitService.audioManager.getMuteState());
    livekitService.init(mode); // init once only
    await livekitService.audioManager.resumeListener(); // .resume onClick

    // below runs & return event listener success or error
    joinRoom(roomName);
  };

  const disconnect = async () => {
    leaveRoom(roomName); // emit leave-room signal to backend
    await livekitService.disconnectFromRoom(); // frontend cleanup
  };

  const toggleMute = () => {
    const status = livekitService.audioManager.toggleMute();
    setIsMuted(status)
  }

  const isPlayerAudioReady = ( playerId:string ): boolean => {
    return (readyStreams.has(playerId));
  }
  const getAudioListener = () => {
    return livekitService.audioManager.listener;
  }
  const getPositionalAudio = ( userId:string ) => {
    const positionalAudio = livekitService.positionalAudios.get(userId);
    if (positionalAudio instanceof THREE.PositionalAudio)
      console.log('useLiveKit: Valid PositionalAudio! ', userId);
    else
      console.error('useLiveKit: Invalid PositionalAudio ', userId);

    return livekitService.positionalAudios.get(userId);
  }
  const getMediaStream = ( userId:string ) => {
    const mediaStream = livekitService.mediaStreams.get(userId);
    if (mediaStream instanceof MediaStream) {
      console.log('useLiveKit: Valid MediaStream! ', userId);
    }
    else {
      console.error('useLiveKit: Invalid media stream ', userId);
    }
    return livekitService.mediaStreams.get(userId);
  }

  return { connect, disconnect, isConnectedRoom,
          isMuted, toggleMute, isLoading, joinCount, 
          activePlane, setActivePlane,
          isPlayerAudioReady,
          getMediaStream, getPositionalAudio, getAudioListener
        };
}

/*
	usecase:
	const { connect, disconnect, isConnected } = useLiveKit('myroom', 'user123');
*/
