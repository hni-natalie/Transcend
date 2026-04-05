/*
  Socket config for multiplayer detection
  export as useSocket(), SocketProvider
*/

import { io, Socket } from 'socket.io-client';
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Player, Position } from '../types/user.types';

const SocketContext     = createContext(null);
export const useSocket  = () => useContext(SocketContext);

export default function SocketProvider ({ children }) {
  const [shouldConnect, setShouldConnect] = useState(false);
  const [isConnected, setIsConnected] = useState<Boolean>(false);
  const [socket, setSocket] = useState< Socket|null >(null);
  const [players, setPlayers] = useState< Player[] >([]);
  const [localPlayerPos, setLocalPlayerPos] = useState< Position | null >(null);
  const [localPlayerId, setLocalPlayerId] = useState<String>(null);
  const [messages, setMessages] = useState([]);

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
      setPlayers(prev => prev.map(p => 
        p.id === data.id 
          ? {...p, position: data.position}
          : p
      ));
      console.log(`Player ${data.id} moved to:`, data.position);
    });
  }

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

    return () => {
      if (socket && !shouldConnect) {
        socket.off('existing-players');
        socket.off('player-joined');
        socket.off('player-left');
        socket.off('player-moved');
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
    localPlayerId,
    setPlayers,
    getPlayerCount,
    getPlayerById,
    getPlayerPosById,
    localPlayerPos,
    setLocalPlayerPos,
    
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