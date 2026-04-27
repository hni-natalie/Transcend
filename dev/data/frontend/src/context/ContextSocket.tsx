/*
  Socket config for multiplayer detection
  export as useSocket(), SocketProvider
*/

import { io, Socket } from 'socket.io-client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Player, Position } from '@shared';

const SocketContext     = createContext(null);
export const useSocket  = () => useContext(SocketContext);

export function SocketProvider ({ children }) {
  const [shouldConnect, setShouldConnect] = useState(false);
  const [isConnected, setIsConnected] = useState<Boolean>(false);
  const [socket, setSocket] = useState< Socket|null >(null);
  const [players, setPlayers] = useState< Player[] >([]);
  const [localPlayerPos, setLocalPlayerPos] = useState< Position | null >(null);
  const [localPlayerId, setLocalPlayerId] = useState<String>(null);
  const [messages, setMessages] = useState([]);
  
  const [currentRoom, setCurrentRoom] = useState<String>(null);
  const [roomPlayers, setRoomPlayers] = useState< Player[] >([]);

  useEffect(() => {
    if (shouldConnect && !socket) {
    const socket = io('/', {
      path: '/api/socket.io',
      transports: ['websocket', 'polling']  // Allow both
    });
    setSocket(socket);

    socket.on('connect', () => {
      console.log('FE: Socket connected!', socket.id);
      setLocalPlayerId(socket.id)
      setIsConnected(true);
    });
    socket.on('connect_error', (err) => {
      console.error('❌ FE: Socket error:', err);
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
      // set all room players
      setRoomPlayers(prev => [...prev, data.player]);
      console.log('[room-joined]curr room players: ', data.participants);

      // Emit event for LiveKit service to connect
      window.dispatchEvent(new CustomEvent('livekit-connect', { 
        detail: data 
      }));
    });
  
    socket.on('player-joined-room', (data) => {
      setRoomPlayers(prev => [...prev, data.player]);
      console.log(`User ${data.player.name}, id:${data.player.id} joined ${data.roomName}`);
    });

    socket.once('players-in-room', (data) => {
      console.log(`Received players:`, data);
      setRoomPlayers(prev => [...prev, ...data]);
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
        socket.off('player-left-room');
        socket.off('room-full');
        socket.off('connect_error');
        socket.off('connect');
        socket.disconnect();
      }
    }
  }, [shouldConnect]);
  

  /* **************************************************************
   * Helper functions
   * **************************************************************/
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
  */
  const joinRoom = useCallback(( roomName:string ) => {
    if (socket && isConnected) {
      console.log(`Requesting to join room: ${roomName}`);
      socket.emit('join-room', { roomName });
    } else {
      console.error('Socket not connected, cannot join room');
    }
  }, [socket, isConnected]);

  // Function to leave current room
  const leaveRoom = useCallback(( roomName:string ) => {
    if (socket && isConnected && currentRoom) {
      // console.log(`Leaving room: ${currentRoom}`);
      socket.emit('leave-room', { roomName });
      setCurrentRoom(null);
      setRoomPlayers(prev => prev.filter(p => p.id !== socket.id));
    }
  }, [socket, isConnected, currentRoom]);

  const fetchRoomPlayers = ( roomName:string ) => {
    socket.emit('existing-room-players', { roomName });
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
    
    /* Player methods */
    players,
    roomPlayers,
    localPlayerId,
    setPlayers,
    setRoomPlayers,
    getPlayerCount,
    getPlayerById,
    getPlayerPosById,
    localPlayerPos,
    setLocalPlayerPos,
    
    /* Room methods */
    joinRoom,
    leaveRoom,
    fetchRoomPlayers,

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
