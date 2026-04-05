/*
  Socket config for multiplayer detection
  export as useSocket(), SocketProvider
*/

import { io, Socket } from 'socket.io-client';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Player } from '../types/user.types';
import * as THREE from 'three';


const SocketContext     = createContext(null);
export const useSocket  = () => useContext(SocketContext);

export default function SocketProvider ({ children }) {
  const [shouldConnect, setShouldConnect] = useState(false);
  const [isConnected, setIsConnected] = useState<Boolean>(false);
  const [socket, setSocket] = useState< Socket|null >(null);
  const [players, setPlayers] = useState< Player[] >([]);
  const [messages, setMessages] = useState([]);
  const playerRefs = useRef<Map<string, THREE.Mesh>>(new Map());

  const setPlayerRef = (playerId: string) => (el: THREE.Mesh | null) => {
    if (el) {
      playerRefs.current.set(playerId, el);
    } else {
      playerRefs.current.delete(playerId);
    }
  };

  useEffect(() => {
    if (shouldConnect && !socket) {
    const socket = io('/', {
      path: '/api/socket.io',
      transports: ['websocket', 'polling']  // Allow both
    });
    setSocket(socket);

    socket.on('connect', () => {
      console.log('FE: Socket connected!', socket.id);
      setIsConnected(true);
    });
    socket.on('connect_error', (err) => {
      console.error('❌ FE: Socket error:', err);
      setIsConnected(false);
    });

    /* Events: Init */
    // socket.on('init', (data) => {
    //   console.log('Init received');
    //   setMyPlayerId(data.playerId);
      
    //   // Initialize all existing players
    //   const playersMap = new Map();
    //   data.players.forEach((player: Player) => {
    //     playersMap.set(player.id, player);
    //   });
    //   setPlayers(players);
    // });

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
          ? {...p, position : data.position}
          : p
      ));
      console.log(`Player ${data.id} moved to:`, data.position);
    });
    // socket.on('player-moved', (data) => {
    //   const remoteMesh = playerRefs.current.get(data.id);
    //   if (remoteMesh) {
    //     // Update remote player position directly
    //     remoteMesh.position.set(
    //       data.position[0], 
    //       data.position[1], 
    //       data.position[2]
    //     );
    //   }
    // });
  }
  //   socket.on('player-moved', (data) => {
  //   // Directly update the remote player's position in the ref
  //   if (remotePlayersRef.current[data.id]) {
  //     remotePlayersRef.current[data.id].position.set(
  //       data.position[0], 
  //       data.position[1], 
  //       data.position[2]
  //     );
      
  //     // Also update rotation if needed
  //     if (data.rotation) {
  //       remotePlayersRef.current[data.id].rotation.set(
  //         data.rotation[0], 
  //         data.rotation[1], 
  //         data.rotation[2]
  //       );
  //     }
  //   }
  // });

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
  
  // Only send local player movement to server
  // const handlePlayerMove = (id: string, position: THREE.Vector3) => {
  //     socket.emit('player-move', { id, position });
  // }

  /* **************************************************************
   * Helper functions
   * **************************************************************/
  const enableSocket = () => setShouldConnect(true);
  const getPlayerCount = () => players.length;
  const getPlayerById = ( playerId:String ) => {
    return players.find(p => p.id === playerId);
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
    // remotePlayersRef,
    setPlayers,
    setPlayerRef,
    getPlayerCount,
    getPlayerById,
    
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