/*
 Handles socket io connection & generates livekit room token
 when socket receives signal
*/

const { generateRoomToken }                = require('../routes/livekit.js');
const { randomHslColor }                   = require('../utils/color.js');
const { apiClient }                        = require('../api/api.client.js');
const { updateSocketId }                   = require('./supabase-utils.service.js');
const prisma                               = require('../../prisma/client');
const { logSpaceActivity, logMeetingActivity } = require('../utils/activity');
const { initRoomData, createPlayer, initRoomSpawnPos, getSpawnPosFromDpId, initRoomComponents } = require('../utils/socket');

const players          = new Map();
const rooms            = new Map();      // Map<roomName, roomData>
const spaceOccupancy   = new Map();
const userCurrentSpace = new Map();
const roomSize         = 30;
let ioInstance         = null;

// Track active sessions across devices/windows: Map<userId, Map<sessionId, Set<socketId>>>
const activeUserSessions = new Map();

// socket io setup
const socketService = (io) => {
  ioInstance = io;

  io.use(async (socket, next) => {
    const token     = socket.handshake.auth.token;
    const sessionId = socket.handshake.auth.sessionId;
    
    if (!token)
      return next(new Error('Authentication error: No token provided'));
    if (!sessionId)
      return next(new Error('Authentication error: No sessionId provided'));
    
    try {
      apiClient.setTokenProvider(token);
      const user = await apiClient.get('/auth/me');
      console.log('[socket] userData: ', user);
      
      if (user) {
        socket.user = user;
        socket.sessionId = sessionId; // Attach sessionId to the socket instance
        next();
      } else {
        return next(new Error('socket.service: User not found'));
      }
    } catch (err) {
      return next(new Error('socket.service: Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId    = socket.user.userId;
    const sessionId = socket.sessionId;

    console.log(`Player connected lobby: ${socket.id} ${socket.user.userName} (Session: ${sessionId})`);

    // --- DUPLICATE SESSION / MULTI-WINDOW DETECTION ---
    if (!activeUserSessions.has(userId)) {
      activeUserSessions.set(userId, new Map());
    }

    const userSessions = activeUserSessions.get(userId);

    // Check if user is connecting from a DIFFERENT browser window or device
    for (const [existingSessionId, socketIds] of userSessions.entries()) {
      if (existingSessionId !== sessionId) {
        console.log(`[socket.service] New login from different window/device detected for user ${userId}. Forcing logout on old session ${existingSessionId}.`);
        
        socketIds.forEach((oldSocketId) => {
          io.to(oldSocketId).emit('force-logout', {
            message: `Logged in at another device/window, logging out now...`,
            timestamp: new Date().toISOString()
          });
        });

        // Clear out sockets belonging to the old session
        userSessions.delete(existingSessionId);
      }
    }

    // Register current socket under the matching sessionId
    if (!userSessions.has(sessionId)) {
      userSessions.set(sessionId, new Set());
    }
    userSessions.get(sessionId).add(socket.id);
    // ----------------------------------------------------

    // Dashboard subscribes to live occupancy updates
    socket.on('subscribe-dashboard', () => {
      socket.join('dashboard-viewers');
      const snapshot = Array.from(spaceOccupancy.entries()).map(([spaceId, count]) => ({
        spaceId,
        count,
      }));
      Array.from(rooms.entries()).forEach(([roomName, roomData]) => {
        snapshot.push({
          roomName,
          count: roomData.users ? roomData.users.length : 0,
        });
      });
      socket.emit('space-occupancy-snapshot', snapshot);
    });

    socket.on('unsubscribe-dashboard', () => {
      socket.leave('dashboard-viewers');
    });

    setTimeout(() => {
      updateSocketId(socket.id, socket.user.userId, 'online');
      socket.emit('online-status', { userId: socket.user.userId, status: 'online' });
      io.emit('user-status-changed', { userId: socket.user.userId, status: 'online' });
    }, 2000);

    // Initialize player
    players.set(socket.id, createPlayer({
      id: socket.id,
      userId: socket.user.userId,
      name: socket.user.userName || socket.id,
      dpId: socket.user?.department?.dpId || 'guest',
      roomName: null,
      position: { x:0, y:0, z:0 },
      rotation: { x:-Math.PI/2, y:0, z:0 },
      color: randomHslColor("80"),
      photo: socket.user.avatarUrl || '',
      audioEnabled: true,
      speaking: false,
    }));
    const player = players.get(socket.id);

    // Send current players to new connection
    socket.emit('existing-players', Array.from(players.values()));
    
    // Broadcast entire new player object to everyone else
    socket.broadcast.emit('player-joined', players.get(socket.id));
    
    // Handle position updates
    socket.on('player-move', (data) => {
      const target = Array.from(players.values()).find(p => p.userId === data.userId);
      if (target && target.roomName) {
        target.position = data.position;
        socket.to(target.roomName).emit('player-moved', data);
      }
    });

    socket.on('initiate-call', ({ directKey, selectedRoomName }) => {
      if (!directKey) return;
      const targetUserId = directKey.split(':').find((id) => id !== player.userId);
      const target = Array.from(players.values()).find((p) => p.userId === targetUserId);
      if (!target) return; // callee offline

      io.to(target.id).emit('incoming-call', {
        caller: player.userId,
        directKey,
        roomName: selectedRoomName,
      });
    });

    socket.on('room-spawn-pos', async (data) => {
      let roomData = rooms.get(data.roomName);
      if (!roomData) {
        roomData = initRoomSpawnPos(rooms, data.roomName, data.positionData);
      } else {
        roomData.positionData = data.positionData;
      }
      console.log('[room-spawn-pos] update roomData');
    });

    socket.on('object-move', (data) => {
      let roomData = rooms.get(data.roomName);
      if (!roomData) return;

      const target = Array.from(roomData.objects.values()).find(p => p.userId === data.userId);
      if (target) {
        target.position = data.position;
        io.in(target.roomName).emit('object-moved', data);
      }
    });

    socket.on('object-acquire', (data) => {
      let roomData = rooms.get(data.roomName);
      if (!roomData) return;
      
      const target = Array.from(roomData.objects.values()).find(p => p.userId === data.objectId);
      if (!target) return;

      target.ownership.ownerId = data.ownerId;
      target.ownership.timestamp = data.timestamp;
      io.in(data.roomName).emit('object-acquired', { objectId: data.objectId, ownerId: data.ownerId, timestamp: data.timestamp });
      console.log('Backend [object-acquire] ', data.objectId, ' owned: ', data.ownerId);
    });

    socket.on('object-release', (data) => {
      let roomData = rooms.get(data.roomName);
      if (!roomData) return;
      io.in(data.roomName).emit('object-released', { objectId: data.objectId });
      console.log('Backend [object-released] ', data.objectId);
    });

    socket.on('space-entered', async ({ spaceId }) => {
      console.log(`[socket] space-entered received: spaceId=${spaceId}, user=${socket.user?.userName}`);
      if (!spaceId || !socket.user?.userId) return;
      await setUserSpacePresence(socket, spaceId);
    });

    socket.on('space-left', async ({ spaceId }) => {
      if (!socket.user?.userId) return;
      await clearUserSpacePresence(socket, spaceId);
    });

    // Event handler for joining rooms
    socket.on('join-room', async ({ roomName }) => {
      if (!player) {
        console.log('Backend[join-room]: player not found on map');
        return;
      } 
      let roomData = rooms.get(roomName);
      
      if (!roomData) {
        roomData = await initRoomData(rooms, roomName);

        await new Promise((resolve) => {
          socket.emit('get-room-spawn-pos', { roomName });
          socket.once('room-spawn-pos', (data) => {
            resolve(data);
          });
          setTimeout(() => {
            resolve(null);
          }, 5000);
        });
        console.log('[socket.service] new room!');
      } else if (roomData.users.length === 0) {
        await initRoomComponents(roomData);
      }

      // Room-size constraints
      if (roomData.users.length > roomSize) {
        socket.emit('room-full', { roomName, maxSize: roomSize });
        console.log('Room Full: current users: ', roomData.users.length);
        return;
      }

      player.roomName = roomName;
      player.position = getSpawnPosFromDpId(roomData, player.dpId);

      if (roomData.users.length > 0) {
        const existingUserIdx = roomData?.users.findIndex(u => u.userId === player.userId);
        if (existingUserIdx !== -1) {
          roomData.users[existingUserIdx] = player;
        } else {
          roomData.users.push(player);
        }
      } else {
        roomData.users.push(player);
      }
      
      socket.join(roomName);
      socket.emit('existing-room-players', roomData?.users || []);
      socket.emit('existing-room-objects', roomData?.objects || []);
      socket.emit('existing-room-particles', roomData?.particles || []);

      const token = await generateRoomToken(roomName, player.id, player.name);

      socket.emit('room-joined', {
        roomName,
        token,
        player,
        participants: roomData.users,
        isCreator: roomData.users.length === 1
      });
      
      socket.to(roomName).emit('player-joined-room', {
        player,
        roomName,
        participantCount: roomData.users.length
      });
      console.log(`${player.name} joined room: ${player.roomName}`);

      emitOccupancyUpdate(roomName); 

      const space = await prisma.space.findUnique({ where: { spaceId: roomName }, select: { spaceName: true } });
      if (space) {
        await logSpaceActivity({
          workspaceId: socket.user.workspaceId,
          userId: socket.user.userId,
          action: 'entered',
          spaceName: space.spaceName,
        });
      } else {
        const meeting = await prisma.meeting.findUnique({ where: { meetId: roomName }, select: { meetTitle: true } });
        if (meeting) {
          await logMeetingActivity({
            workspaceId: socket.user.workspaceId,
            userId: socket.user.userId,
            action: 'joined a meeting',
            contextTitle: meeting.meetTitle,
            spaceName: undefined,
            date: new Date(),
          });
          
          const userService = require('./user.service');
          await userService.updateUserStatus(socket.user.userId, 'in_meeting');
        }
      }
    });

    socket.on('request-room-players', async ({ roomName }) => {
      let roomData = rooms.get(roomName);
      if (!roomData) {
        roomData = await initRoomData(rooms, roomName);
        
        await new Promise((resolve) => {
          socket.emit('get-room-spawn-pos', { roomName });
          socket.once('room-spawn-pos', (data) => {
            resolve(data);
          });
          setTimeout(() => {
            resolve(null);
          }, 5000);
        });
      } else if (roomData.users.length === 0) {
        await initRoomComponents(roomData);
      }
      socket.emit('existing-room-players', roomData?.users || []);
    });

    socket.on('leave-room', async ({ roomName }) => {
      if (!player) { console.log('player not found'); return; }
      handleLeaveRoom(socket, player, roomName);

      const space = await prisma.space.findUnique({ where: { spaceId: roomName }, select: { spaceName: true } });
      if (space) {
        await logSpaceActivity({
          workspaceId: socket.user.workspaceId,
          userId: socket.user.userId,
          action: 'left',
          spaceName: space.spaceName,
        });
      } else {
        const meeting = await prisma.meeting.findUnique({ where: { meetId: roomName }, select: { meetTitle: true } });
        if (meeting) {
          const userService = require('./user.service');
          await userService.updateUserStatus(socket.user.userId, 'online');
        }
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);

      // --- CLEANUP SESSION MAP ---
      const uSessions = activeUserSessions.get(userId);
      if (uSessions) {
        const sSockets = uSessions.get(sessionId);
        if (sSockets) {
          sSockets.delete(socket.id);
          if (sSockets.size === 0) {
            uSessions.delete(sessionId);
          }
        }
        if (uSessions.size === 0) {
          activeUserSessions.delete(userId);
        }
      }
      // ---------------------------

      clearUserSpacePresence(socket);
      if (player.roomName)
        handleLeaveRoom(socket, player, player.roomName);
      
      players.delete(socket.id);
      socket.broadcast.emit('player-left', { id: socket.id });
      updateSocketId(socket.id, socket.user.userId, 'offline');
      socket.emit('online-status', { status: 'offline' });
      io.emit('user-status-changed', { userId: socket.user.userId, status: 'offline' });
    });

    /* *****************************************************************
     * Setup Helper Functions
     * ****************************************************************/

    function emitOccupancyUpdate(roomName) {
      const roomData = rooms.get(roomName);
      const count = roomData ? roomData.users.length : 0;
      io.to('dashboard-viewers').emit('space-occupancy-changed', { roomName, count });
    }

    async function setUserSpacePresence(socket, nextSpaceId) {
      const userId = socket.user.userId;
      const previousSpaceId = userCurrentSpace.get(userId);

      if (previousSpaceId === nextSpaceId) return;

      if (previousSpaceId) {
        await updateSpaceOccupancy(previousSpaceId, -1);
        await logSpaceActivityForSpace(socket, previousSpaceId, 'left');
      }

      userCurrentSpace.set(userId, nextSpaceId);
      await updateSpaceOccupancy(nextSpaceId, 1);
      await logSpaceActivityForSpace(socket, nextSpaceId, 'entered');
    }

    async function clearUserSpacePresence(socket, spaceId = null) {
      const userId = socket.user.userId;
      const currentSpaceId = userCurrentSpace.get(userId);
      const targetSpaceId = spaceId || currentSpaceId;

      if (!targetSpaceId || currentSpaceId !== targetSpaceId) return;

      userCurrentSpace.delete(userId);
      await updateSpaceOccupancy(targetSpaceId, -1);
      await logSpaceActivityForSpace(socket, targetSpaceId, 'left');
    }

    async function updateSpaceOccupancy(spaceId, delta) {
      const nextCount = Math.max((spaceOccupancy.get(spaceId) || 0) + delta, 0);

      if (nextCount === 0) {
        spaceOccupancy.delete(spaceId);
      } else {
        spaceOccupancy.set(spaceId, nextCount);
      }

      io.to('dashboard-viewers').emit('space-occupancy-changed', { spaceId, count: nextCount });
    }

    async function logSpaceActivityForSpace(socket, spaceId, action) {
      const space = await prisma.space.findUnique({
        where: { spaceId },
        select: {
          spaceName: true,
          department: {
            select: { dpName: true }
          }
        }
      });

      if (!space) return;

      await logSpaceActivity({
        workspaceId: socket.user.workspaceId,
        userId: socket.user.userId,
        action,
        spaceName: space.spaceName,
        departmentName: space.department?.dpName ?? null,
      });
    }

    function handleLeaveRoom(socket, player, roomName) {
      if (!player) return;

      const roomData = rooms.get(roomName);
      if (roomData) {
        const playerExists = roomData.users.some(u => u.id === player.id);
        if (!playerExists) return;

        roomData.users = roomData.users.filter(u => u.id !== player.id);

        socket.leave(roomName);
        player.roomName = null;

        socket.to(roomName).emit('player-left-room', { 
          id: player.id,
          roomName,
          playerName: player.name,
        });
        
        if (roomData.users.length === 0) {
          rooms.delete(roomName);
          console.log(`Room ${roomName} closed.`);
        }

        emitOccupancyUpdate(roomName);
      }

      const directCallMatch = roomName.match(/^(.+):(voice|video)$/);
      if (directCallMatch) {
        const directKey = directCallMatch[1];
        const targetUserId = directKey.split(':').find((id) => id !== player.userId);
        const target = Array.from(players.values()).find((p) => p.userId === targetUserId);
        if (target) {
          io.to(target.id).emit('call-ended', { directKey });
        }
      }
    }
  });
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.IO is not initialized");
  }
  return ioInstance;
};

module.exports = {
  players,
  socketService,
  getIO
};