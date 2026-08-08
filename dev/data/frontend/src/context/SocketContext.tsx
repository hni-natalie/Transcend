/*
  Socket context for multiplayer detection
  export as useSocket(), SocketProvider
*/

import { io, Socket } from 'socket.io-client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Player } from '@shared/types/user.types';
import { useAuth } from '@/features/auth/AuthContext';

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
  // const [messages, setMessages] = useState([]);
  
  // status sync across pages
  const [userStatuses, setUserStatuses] = useState<Record<string, string>>({});
  
  const [currentRoom, setCurrentRoom] = useState<String>(null);
  const [roomPlayers, setRoomPlayers] = useState< Player[] >([]);
  
  // for dashboard
  const [roomOccupancy, setRoomOccupancy] = useState<Record<string, number>>({});

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
      // setPlayers(prev => prev.map(p => 
      setRoomPlayers(prev => prev.map(p => 
        p.id === data.id 
          ? {...p, position: data.position}
          : p
      ));
      // console.log(`Player ${data.id} moved to:`, data.position);
    });

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
      console.log(`User ${data.player.name}, id:${data.player.id} joined ${data.roomName}`);
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
      // You might want to show a notification to user
      window.dispatchEvent(new CustomEvent('room-error', { 
        detail: { type: 'full', message: `Room ${data.roomName} is full` }
      }));
    });

	// syncs all user status across pages
	// socket.on('user-status-changed', (data: { userId: string; status: string }) => {
	//   setUserStatuses((prev) => ({ ...prev, [data.userId]: data.status }));
	// });

	socket.on('user-status-changed', (data) => {
	  console.log('[SocketContext] received user-status-changed:', data); // TEMP
	  setUserStatuses((prev) => ({ ...prev, [data.userId]: data.status }));
	});

	// for admin's dashboard; office and space occupancy mapping
	socket.on('space-occupancy-snapshot', (snapshot: { roomName: string; count: number }[]) => {
	  const map: Record<string, number> = {};
	  snapshot.forEach((s) => { map[s.roomName] = s.count; });
	  setRoomOccupancy(map);
	});

	socket.on('space-occupancy-changed', (data: { roomName: string; count: number }) => {
	  setRoomOccupancy((prev) => ({ ...prev, [data.roomName]: data.count }));
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
        socket.off('room-joined');
        socket.off('player-joined-room');
        socket.off('existing-room-players');
        socket.off('player-left-room');
        socket.off('room-full');
        socket.off('connect_error');
        socket.off('connect');
		socket.off('user-status-changed');
		socket.off('space-occupancy-snapshot');
		socket.off('space-occupancy-changed');
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

  // added for dashboard
  const subscribeDashboard = useCallback(() => {
	if (socket && isConnected) {
	  socket.emit('subscribe-dashboard');
	}
  }, [socket, isConnected]);

  const unsubscribeDashboard = useCallback(() => {
	if (socket && isConnected) {
	  socket.emit('unsubscribe-dashboard');
	}
  }, [socket, isConnected]);


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
    // onlineStatus,
    // setOnlineStatus,
	userStatuses,
    
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

    /* Chat methods */
    // messages,
    // sendMessage,
    // clearMessages,
    // addSystemMessage,

	/* Dashboard methods */
	roomOccupancy,
    subscribeDashboard,
    unsubscribeDashboard,
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
