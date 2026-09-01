/*
	separate hook logic to link to livekit service
	that generates token
*/

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { livekitService } from '@/features/livekit/services/livekitService';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTE_PATH as R } from '@config/routes.manifest';
import { useSocket } from '@/context/SocketContext';
import { LivekitMode } from '@/shared/types/livekit.types';
import * as THREE from 'three'; //debug

export function useLiveKit( roomName:string ) {
  const { enableSocket, joinRoom, leaveRoom } = useSocket();
  const navigate = useNavigate();

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

  const isCurrentLoading = useMemo(() => {
    return state.loadingRoomName === roomName && state.isLoading;
  }, [state.loadingRoomName, state.isLoading, roomName]);

  /* 
    calls socket.emit join-room to backend, backend creates room token
    then route back to connectToRoom in livekitService, create Room() in frontend
  */
 
  const connect = async ( mode:LivekitMode ) => {

    console.log("🔥 useLiveKit connect called", { roomName, mode });
    if (!livekitService.checkBrowserSupport()) {
      console.warn('LiveKitService: Browser not supported');
      alert('LiveKitService: Browser not supported for livekit features!');
    }
    livekitService.clearError();
    setIsLoading(true, roomName)
    setIsMuted(livekitService.audioManager.getMuteState());
    livekitService.init(mode); // init once only
    await livekitService.audioManager.resumeListener(); // .resume onClick

    // below runs & wait for livekit-connect signal if success
    // handles isLoading state in connectToRoom
    joinRoom(roomName);
    console.log("🔥 joinRoom emitted");
  };

  const createRoom = () => {
    joinRoom(roomName);
  }

  const disconnect = async ( showLoading:boolean ) => {
    if (showLoading)
      setIsLoading(true, roomName);
    leaveRoom(roomName); // emit leave-room signal to backend
    await livekitService.disconnectFromRoom(); // frontend cleanup, setLoading false 
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
  const getLivekitRoom = () => {
    return livekitService.lkRoom;
  }
  const setActivePlane = useCallback(( index:number | null ) => {
      livekitService.setActivePlane(index);
  }, []);
  const setIsConnectedRoom = useCallback(( status:boolean ) => {
    livekitService.setIsConnectedRoom(status);
  }, []);
  const setIsLoading = useCallback(( status:boolean, roomName:string ) => {
    livekitService.setIsLoading(status, roomName);
  }, []);
  const setIsMuted = useCallback(( status:boolean ) => {
    livekitService.setIsMuted(status);
  }, []);
  const locateOfficeUser = (href: string, targetPosition?: { x: number; y: number; z: number }) => async () => {
      await connect("room");
      navigate( href, {
        state: {
          targetPosition: targetPosition || { x:0, y:0, z:0 }
        }
      });
  }

  return { connect, disconnect,
          createRoom, 
          toggleMute, setActivePlane,
          isMuted: state.isMuted, isLoading: state.isLoading, joinCount: state.joinCount, 
          activePlane: state.activePlane,
          isConnectedRoom: state.isConnectedRoom,
          currentRoomName: state.currentRoomName,
          isCurrentLoading,
          isBrowserSupported: livekitService.checkBrowserSupport(),
          isPlayerAudioReady,
          getMediaStream, getPositionalAudio, getAudioListener, getLivekitRoom,
          error: state.error,
          locateOfficeUser,
        };
}

/*
	usecase:
	const { connect, disconnect, isConnected } = useLiveKit('myroom', 'user123');
*/
