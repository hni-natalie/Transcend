/*
  Socket context for multiplayer detection
  export as useSocket(), SocketProvider
*/

import { io, Socket } from 'socket.io-client';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Player } from '@shared/types/user.types';
import { useAuth } from '@/features/auth/AuthContext';
import { Position } from '@shared';

const SocketContext     = createContext(null);
export const useSocket  = () => useContext(SocketContext);

export function SocketProvider ({ children }) {
  const { logout } = useAuth();

  const [shouldConnect, setShouldConnect] = useState(false);
  const [isConnected, setIsConnected] = useState<Boolean>(false);
  const [socket, setSocket] = useState< Socket|null >(null);
  const [players, setPlayers] = useState< Player[] >([]);
  const [localPlayerId, setLocalPlayerId] = useState<String>(null);
  // const [onlineStatus, setOnlineStatus] = useState('offline')
  const [messages, setMessages] = useState([]);
  
  const [currentRoom, setCurrentRoom] = useState<String>(null);
  const [roomPlayers, setRoomPlayers] = useState< Player[] >([]);
  const [roomObjs, setRoomObjs] = useState< Player[] >([]);

  useEffect(() => {
  const token = getToken();
  if (!token) return ;

  if (shouldConnect && !socket) {
    const socket = io('/', {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],  // Allow both
      auth: { token },
    });
    setSocket(socket);

    socket.on('force-logout', (data) => {
      console.log('[force-logout] ', data.timestamp, ' ', data.message);
      logout();
    }) 
    socket.on('connect', () => {
      console.log('FE: Socket connected!', socket.id);
      setLocalPlayerId(socket.id)
    });
    socket.on('online-status', (data) => {
      setTimeout(() => {
        setIsConnected(true);
        // console.log('FE: socketUserId ', data.userId);
        // setLocalPlayerId(data.userId)
        // setOnlineStatus(data.status);
      }, 1000);
    });
    socket.on('connect_error', (err) => {
      console.error('❌ FE: Socket error:', err);
			alert("Unable to connect, please reload page and try again.");
      setIsConnected(false);
    });

    /* Events: Player */
    socket.on('existing-players', (players) => {
      setPlayers(players);
      console.log('[existing-players] currently online: ', players);
    });
    socket.on('existing-room-objects', (objects) => {
      // console.log('[existing-room-objects] test ', objects[0]);
      setRoomObjs(objects);
      console.log('[existing-room-objects] all: ', objects);
    });

    socket.on('player-joined', (data) => {
      setPlayers(prev => [...prev, data]);
      console.log(`Player ${data.id || data.name} joined`);
    });
    socket.on('player-left', (data) => {
      setPlayers(prev => prev.filter(p => p.id !== data.id));
      console.log(`Player ${data.id || data.name} left`);
      console.log('[player-left] currently online: ', players);
    });

    socket.on('player-moved', (data) => {
      setRoomPlayers(prev => prev.map(p => 
        p.userId === data.userId 
          ? {...p, position: data.position}
          : p
      ));
      // console.log(`Player ${data.userId} moved to:`, data.position);
    });

    socket.on('object-moved', (data) => {
      setRoomObjs(prev => prev.map(p => 
        p.userId === data.userId 
          ? {...p, position: data.position}
          : p
      ));
      // console.log(`Object ${data.userId} moved to:`, data.position);
    });

    socket.on('object-acquired', (data) => {
      console.log('[object-acquired] ', data.objectId);
      setRoomObjs(prev => prev.map(p => 
        p.userId === data.objectId 
          ? {...p,
          ownership: {
            ...p.ownership,
            ownerId: data.ownerId,
            timestamp: data.timestamp
          }
        }
        : p
      ));
      console.log('[object-acquired] ', data.objectId, ' by ', data.ownerId);
    })
    socket.on('object-released', (data) => {
      setRoomObjs(prev => prev.map(p => 
        p.userId === data.objectId 
          ? {...p,
          ownership: {
            ...p.ownership,
            ownerId: null,
            timestamp: null
          }
        }
        : p
      ));
      console.log('[object-released] ', data.objectId);
    })

    /* Events: Room */
    // socket.on('existing-room-players', (players) => {
    //   setRoomPlayers(players);
    //   console.log('[existing-room]curr room players: ', roomPlayers);
    // });

    /* handles data after backend successfully creates room token */
    socket.on('room-joined', (data) => {
      console.log('Room joined successfully:', data);
      setCurrentRoom(data.roomName);
      console.log('[room-joined]curr room players: ', data.participants);

      // Emit event for LiveKit service to connect
      window.dispatchEvent(new CustomEvent('livekit-connect', { 
        detail: data 
      }));
    });
  
    // update when new player joins
    socket.on('player-joined-room', (data) => {
      setRoomPlayers(prev => [...prev, data.player]);
      console.log(`User ${data.player.name}, sockId:${data.player.id} joined ${data.roomName}`);
    });

    // existing players
    socket.on('existing-room-players', (data) => {
      console.log(`[existing-room-players]:`, data);
      setRoomPlayers(data);
      // setRoomPlayers(prev => [...prev, ...data]);
    })
  
    // User left room
    socket.on('player-left-room', (data) => {
      console.log(`User ${data.playerName} id:${data.id} left ${data.roomName}`);
      setRoomPlayers(prev => prev.filter(p => p.id !== data.id));
    });
  
    // Room full error
    socket.on('room-full', (data) => {
      console.warn(`Room ${data.roomName} is full (max: ${data.maxSize})`);
			alert("Room is fully occupied, please wait and retry later.");

      // You might want to show a notification to user
      window.dispatchEvent(new CustomEvent('room-error', { 
        detail: { type: 'full', message: `Room ${data.roomName} is full` }
      }));
    });
  
  /* Events: Chat */
    // socket.on('chat-message', (messageData) => {
    //   setMessages(prev => [...prev, {
    //     ...messageData,
    //     timestamp: new Date(),
    //     id: Date.now()
    //   }]);
    // });
    // socket.on('previous-messages', (previousMessages) => {
    //   setMessages(previousMessages);
    // });
  }


    return () => {
      if (socket && !shouldConnect) {
        socket.off('existing-players');
        socket.off('player-joined');
        socket.off('player-left');
        socket.off('player-moved');
        socket.off('object-moved');
        socket.off('object-acquired');
        socket.off('object-released');
        socket.off('room-joined');
        socket.off('player-joined-room');
        socket.off('existing-room-players');
        socket.off('existing-room-objects');
        socket.off('player-left-room');
        socket.off('room-full');
        socket.off('connect_error');
        socket.off('connect');
        socket.off('online-status');
        socket.off('force-logout');
        socket.disconnect();
      }
    }
  }, [shouldConnect]);
  

  /* **************************************************************
   * Helper functions
   * **************************************************************/
  const getToken = () => localStorage.getItem('token');
  const enableSocket = () => setShouldConnect(true);
  const getPlayerCount = () => players.length;
  const getPlayerById = ( playerId:String ) => {
    return players.find(p => p.id === playerId);
  };
  const getPlayerPosById = ( playerId:String ) => {
    const player = players.find(p => p.id === playerId);
    return player?.position;
  };
  /*
    Function to join a room
    emits to backend to create room token, then done
    backend will return token & details in signal room-joined
    frontend then dispatch signal livekit-connect
  */
  const joinRoom = useCallback((roomName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        console.error('Socket not connected, cannot join room');
        reject(new Error('Not connected to server. Please reload and try again.'));
        return;
      }

      console.log(`Requesting to join room: ${roomName}`);

      const cleanup = () => {
        clearTimeout(timeout);
        socket.off('room-joined', onJoined);
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Join room timed out. Please try again.'));
      }, 10000);

      const onJoined = (data: { roomName: string }) => {
        if (data.roomName !== roomName) return; // ignore events for other rooms
        cleanup();
        resolve();
      };

      socket.once('room-joined', onJoined);

      socket.emit('join-room', { roomName });
    });
  }, [socket, isConnected]);

  // Function to leave current room
  const leaveRoom = useCallback(( roomName:string ) => {
    if (socket && isConnected && currentRoom) {
      // console.log(`Leaving room: ${currentRoom}`);
      socket.emit('leave-room', { roomName });
      setCurrentRoom(null);
      // setRoomPlayers(prev => prev.filter(p => p.id !== socket.id)); // remove myself only
      setRoomPlayers(prev => []);
    }
  }, [socket, isConnected, currentRoom]);

  const fetchRoomPlayers = ( roomName:string ) => {
    console.log('Fetching room players in ', roomName);
    socket.emit('request-room-players', { roomName });
  }


  // const sendMessage = (text, senderName) => {
  //   if (socket && text.trim()) {
  //     const messageData = {
  //       text: text.trim(),
  //       sender: senderName,
  //       timestamp: new Date(),
  //       senderId: socket.id
  //     };
  //     socket.emit('send-message', messageData);
  //   }
  // };
  // const addSystemMessage = (text) => {
  //   setMessages(prev => [...prev, {
  //     text,
  //     isSystem: true,
  //     timestamp: new Date(),
  //     id: Date.now()
  //   }]);
  // };
  // const clearMessages = () => {
  //   setMessages([]);
  // };

  const value = {
    /* State */
    enableSocket,
    isConnected,
    socket,
    shouldConnect,
    // onlineStatus,
    // setOnlineStatus,
    
    /* Player methods */
    players,
    roomPlayers,
    localPlayerId,
    setPlayers,
    setRoomPlayers,
    getPlayerCount,
    getPlayerById,
    getPlayerPosById,
    // localPlayerPos,
    // setLocalPlayerPos,
    
    /* Room methods */
    joinRoom,
    leaveRoom,
    fetchRoomPlayers,
    roomObjs,
    setRoomObjs,

    /* Chat methods */
    // messages,
    // sendMessage,
    // clearMessages,
    // addSystemMessage,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

/*
 use case:
  const { enableSocket, localPlayerId } = useSocket();
*/
