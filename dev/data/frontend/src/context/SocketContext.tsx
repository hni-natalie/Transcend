/*
  Socket context for multiplayer detection
  export as useSocket(), SocketProvider
*/

import { io, Socket } from 'socket.io-client';
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Player } from '@shared/types/user.types';
import { useAuth } from '@/features/auth/AuthContext';

// 1. Define the Context interface
interface SocketContextType {
  enableSocket: () => void;
  isConnected: boolean;
  socket: Socket | null;
  shouldConnect: boolean;
  userStatuses: Record<string, string>;
  players: Player[];
  roomPlayers: Player[];
  localPlayerId: string | null;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setRoomPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  getPlayerCount: () => number;
  getPlayerById: (playerId: string) => Player | undefined;
  getPlayerPosById: (playerId: string) => any;
  joinRoom: (roomName: string) => Promise<void>;
  leaveRoom: (roomName: string) => void;
  fetchRoomPlayers: (roomName: string) => void;
  roomObjs: Player[];
  roomParticles: Player[];
  setRoomObjs: React.Dispatch<React.SetStateAction<Player[]>>;
  roomOccupancy: Record<string, number>;
  latestActivity: any;
  activitySeq: number;
  subscribeDashboard: () => void;
  unsubscribeDashboard: () => void;
}

// 2. Pass the interface to createContext
const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Helper function to get or create a session ID unique to this tab lineage
// Use localStorage so all tabs share the exact same sessionId
const getSessionId = () => {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

export function SocketProvider ({ children }: { children: ReactNode }) {
  const { logout } = useAuth();

  const [shouldConnect, setShouldConnect] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);
  
  // status sync across pages
  const [userStatuses, setUserStatuses] = useState<Record<string, string>>({});
  
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [roomPlayers, setRoomPlayers] = useState<Player[]>([]);
  
  const [roomOccupancy, setRoomOccupancy] = useState<Record<string, number>>({});
  const [roomObjs, setRoomObjs] = useState<Player[]>([]); 
  const [roomParticles, setRoomParticles] = useState<Player[]>([]);

  // for /admin/activity
  const [latestActivity, setLatestActivity] = useState<any>(null);
  const [activitySeq, setActivitySeq] = useState<number>(0);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    if (shouldConnect && !socket) {
      const sessionId = getSessionId(); // Retrieve or create session ID

      const socketInstance = io('/', {
        path: '/api/socket.io',
        transports: ['websocket', 'polling'],
        auth: { 
          token,
          sessionId // Pass sessionId to backend
        },
      });
      setSocket(socketInstance);

      socketInstance.on('force-logout', (data) => {
        console.log('[force-logout] ', data.timestamp, ' ', data.message);
        localStorage.removeItem('sessionId');
        logout();
      });

      socketInstance.on('connect', () => {
        console.log('FE: Socket connected!', socketInstance.id);
        setLocalPlayerId(socketInstance.id ?? null);
      });

      socketInstance.on('online-status', () => {
        setTimeout(() => {
          setIsConnected(true);
        }, 1000);
      });

      socketInstance.on('connect_error', (err) => {
        console.error('❌ FE: Socket error:', err);
        alert("Unable to connect, please reload page and try again.");
        setIsConnected(false);
      });

      /* Events: Player */
      socketInstance.on('existing-players', (players) => {
        setPlayers(players);
        console.log('[existing-players] currently online: ', players);
      });

      socketInstance.on('existing-room-objects', (objects) => {
        setRoomObjs(objects);
        console.log('[existing-room-objects] all: ', objects);
      });

      socketInstance.on('existing-room-particles', (objects) => {
        setRoomParticles(objects);
      });

      socketInstance.on('player-joined', (data) => {
        setPlayers(prev => [...prev, data]);
        console.log(`Player ${data.id || data.name} joined`);
      });

      socketInstance.on('player-left', (data) => {
        setPlayers(prev => prev.filter(p => p.id !== data.id));
        console.log(`Player ${data.id || data.name} left`);
      });

      socketInstance.on('player-moved', (data) => {
        setRoomPlayers(prev => prev.map(p => 
          p.userId === data.userId 
            ? {...p, position: data.position}
            : p
        ));
      });

      socketInstance.on('object-moved', (data) => {
        setRoomObjs(prev => prev.map(p => 
          p.userId === data.userId 
            ? {...p, position: data.position}
            : p
        ));
      });

      socketInstance.on('object-acquired', (data) => {
        console.log('[object-acquired] ', data.objectId);
        setRoomObjs(prev => prev.map(p => 
          p.userId === data.objectId 
            ? {
                ...p,
                ownership: {
                  ...p.ownership,
                  ownerId: data.ownerId,
                  timestamp: data.timestamp
                }
              }
            : p
        ));
        console.log('[object-acquired] ', data.objectId, ' by ', data.ownerId);
      });

      socketInstance.on('object-released', (data) => {
        setRoomObjs(prev => prev.map(p => 
          p.userId === data.objectId 
            ? {
                ...p,
                ownership: {
                  ...p.ownership,
                  ownerId: null,
                  timestamp: null
                }
              }
            : p
        ));
        console.log('[object-released] ', data.objectId);
      });

      /* Events: Room */
      socketInstance.on('room-joined', (data) => {
        console.log('Room joined successfully:', data);
        setCurrentRoom(data.roomName);

        window.dispatchEvent(new CustomEvent('livekit-connect', { 
          detail: data 
        }));
      });

      socketInstance.on('existing-room-players', (data) => {
        console.log(`[existing-room-players]:`, data);
        setRoomPlayers(data);
      })
    
      socketInstance.on('player-left-room', (data) => {
        console.log(`User ${data.playerName} id:${data.id} left ${data.roomName}`);
        setRoomPlayers(prev => prev.filter(p => p.id !== data.id));
      });
    
      socketInstance.on('room-full', (data) => {
        console.warn(`Room ${data.roomName} is full (max: ${data.maxSize})`);
        alert("Room is fully occupied, please wait and retry later.");

        window.dispatchEvent(new CustomEvent('room-error', { 
          detail: { type: 'full', message: `Room ${data.roomName} is full` }
        }));
      });

      socketInstance.on('user-status-changed', (data: { userId: string; status: string }) => {
        console.log('[SocketContext] received user-status-changed:', data);
        setUserStatuses((prev) => ({ ...prev, [data.userId]: data.status }));
      });

      socketInstance.on('space-occupancy-snapshot', (snapshot: any[]) => {
        console.log('[SocketContext] space-occupancy-snapshot received:', snapshot);
        const map: Record<string, number> = {};
        snapshot.forEach((s) => {
          const key = s.spaceId || s.roomName;
          if (key) map[key] = s.count;
        });
        console.log('[SocketContext] mapped roomOccupancy:', map);
        setRoomOccupancy(map);
      });

      socketInstance.on('space-occupancy-changed', (data: any) => {
        console.log('[SocketContext] space-occupancy-changed received:', data);
        const key = data.spaceId || data.roomName;
        if (key) {
          setRoomOccupancy((prev) => {
            const nextMap = { ...prev, [key]: data.count };
            console.log('[SocketContext] updated roomOccupancy:', nextMap);
            return nextMap;
          });
        }
      });

      socketInstance.on('activity-created', (data: { workspaceId: string; activity: any }) => {
        console.log('[SocketContext] activity-created received:', data);
        setLatestActivity(data.activity);
        setActivitySeq((prev) => prev + 1);
      });
    }

    return () => {
      if (socket) {
        socket.off('existing-players');
        socket.off('player-joined');
        socket.off('player-left');
        socket.off('player-moved');
        socket.off('object-moved');
        socket.off('object-acquired');
        socket.off('object-released');
        socket.off('room-joined');
        socket.off('existing-room-players');
        socket.off('existing-room-objects');
        socket.off('existing-room-particles');
        socket.off('player-left-room');
        socket.off('room-full');
        socket.off('connect_error');
        socket.off('connect');
        socket.off('user-status-changed');
        socket.off('space-occupancy-snapshot');
        socket.off('space-occupancy-changed');
        socket.off('activity-created');
        socket.off('online-status');
        socket.off('force-logout');
        socket.disconnect();
      }
    };
  }, [shouldConnect]);
  

  /* **************************************************************
   * Helper functions
   * **************************************************************/
  const getToken = () => localStorage.getItem('token');
  const enableSocket = () => setShouldConnect(true);
  const getPlayerCount = () => players.length;
  const getPlayerById = (playerId: string) => players.find(p => p.id === playerId);
  const getPlayerPosById = (playerId: string) => players.find(p => p.id === playerId)?.position;

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
        if (data.roomName !== roomName) return;
        cleanup();
        resolve();
      };

      socket.once('room-joined', onJoined);
      socket.emit('join-room', { roomName });
    });
  }, [socket, isConnected]);

  const leaveRoom = useCallback((roomName: string) => {
    if (socket && isConnected && currentRoom) {
      socket.emit('leave-room', { roomName });
      setCurrentRoom(null);
      setRoomPlayers([]);
    }
  }, [socket, isConnected, currentRoom]);

  const fetchRoomPlayers = (roomName: string) => {
    console.log('Fetching room players in ', roomName);
    socket?.emit('request-room-players', { roomName });
  };

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

  const value = {
    enableSocket,
    isConnected,
    socket,
    shouldConnect,
    userStatuses,
    players,
    roomPlayers,
    localPlayerId,
    setPlayers,
    setRoomPlayers,
    getPlayerCount,
    getPlayerById,
    getPlayerPosById,
    joinRoom,
    leaveRoom,
    fetchRoomPlayers,
    roomObjs,
    roomParticles,
    setRoomObjs,
    roomOccupancy,
    latestActivity,
    activitySeq,
    subscribeDashboard,
    unsubscribeDashboard,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}