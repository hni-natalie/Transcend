/*
	separate hook logic to link to livekit service
	that generates token
*/

import { useEffect, useState, useRef, useCallback } from 'react';
import { livekitService } from '@/features/livekit/services/livekitService';
import { useLocation } from 'react-router-dom';
import { ROUTE_PATH as R } from '@config/routes.manifest';
import { useSocket } from '@/features/socketio/SocketContext';
import * as THREE from 'three'; //debug

// export function useLiveKit( roomName:string , participantName:string ) {
export function useLiveKit( roomName:string ) {
  const { enableSocket, joinRoom, leaveRoom } = useSocket();
  useEffect(() => { enableSocket(); }, []);
  
  const [state, setState] = useState(() => livekitService.getState());
  const location = useLocation();

  const isConnectedRef = useRef(state.isConnectedRoom);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
      const initialState = livekitService.getState();
      setState(initialState);
      
      // Subscribe to ALL state changes
      const unsubscribe = livekitService.onStateChange((newState) => {
          // console.log('📡 State updated:', newState);
          setState(newState);
      });
      
      return () => { unsubscribe(); }
  }, []);

  // disconnect when move to other page
  useEffect(() => {
      isConnectedRef.current = state.isConnectedRoom;
  }, [state.isConnectedRoom]);
  useEffect(() => {
    const currentPath = location.pathname;

    if (prevPathRef.current !== currentPath) {
      if (prevPathRef.current === R.USER_OFFICE) {
        disconnect(false);
      }
      prevPathRef.current = currentPath
    }
  }, [location]);

  /* 
    calls socket.emit join-room to backend, backend creates room token
    then route back to connectToRoom in livekitService, create Room() in frontend
  */
  const connect = async ( mode: "room" | "call" ) => {

    setIsLoading(true)
    setIsMuted(livekitService.audioManager.getMuteState());
    livekitService.init(mode); // init once only
    await livekitService.audioManager.resumeListener(); // .resume onClick

    // below runs & wait for livekit-connect signal if success
    // handles isLoading state in connectToRoom
    joinRoom(roomName);
  };

  const disconnect = async ( showLoading:boolean ) => {
    if (showLoading)
      setIsLoading(true);
    leaveRoom(roomName); // emit leave-room signal to backend
    await livekitService.disconnectFromRoom(); // frontend cleanup
  };

  const toggleMute = () => {
    const status = livekitService.audioManager.toggleMute();
    setIsMuted(status)
  }

  const isPlayerAudioReady = ( playerId:string ): boolean => {
    return (livekitService.readyStreams.has(playerId));
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
  const setActivePlane = useCallback(( index:number | null ) => {
      livekitService.setActivePlane(index);
  }, []);
  const setIsConnectedRoom = useCallback(( status:boolean ) => {
    livekitService.setIsConnectedRoom(status);
  }, []);
  const setIsLoading = useCallback(( status:boolean ) => {
    livekitService.setIsLoading(status);
  }, []);
  const setIsMuted = useCallback(( status:boolean ) => {
    livekitService.setIsMuted(status);
  }, []);

  return { connect, disconnect, 
          toggleMute, setActivePlane,
          isMuted: state.isMuted, isLoading: state.isLoading, joinCount: state.joinCount, 
          activePlane: state.activePlane,
          isConnectedRoom: state.isConnectedRoom,
          isPlayerAudioReady,
          getMediaStream, getPositionalAudio, getAudioListener
        };
}

/*
	usecase:
	const { connect, disconnect, isConnected } = useLiveKit('myroom', 'user123');
*/
