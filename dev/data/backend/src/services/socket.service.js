/*
 Handles socket io connection & generates livekit room token
 when socket receives signal
*/

// interface Player {
//   id: string;
//   position: { x:number; y:number; z:number };
//   rotation: number;
//   color: string;
// }
/* **************************************************************** */

const { generateRoomToken }                = require('../routes/livekit.js')
const { randomHslColor }                   = require('../utils/color.js');
const { apiClient }                        = require('../api/api.client.js')
const { updateSocketId }                   = require('./supabase-utils.service.js')
const { initializeRoomData, createPlayer, randomPosition } = require('../utils/socket')
const players     = new Map();
const rooms       = new Map();      // Map<roomName, roomPlayers> : Map<roomName, [roomPlayers, roomObjects]>
let ioInstance = null;

// socket io setup
const socketService = (io) => {
  ioInstance = io;

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    // /*debug*/ console.log('Token received:', token ? 'Yes' : 'No');
    
    if (!token)
        return next(new Error('Authentication error: No token provided'));
    
    apiClient.setTokenProvider(token);
    const user = await apiClient.get('/auth/me');
    console.log('[socket] userData: ', user);
    if (user) {
      socket.user = user;
      next();
    }
    else
      return next(new Error('socket.service: User not found'));
  })
	io.on('connection', (socket) => {
  console.log(`Player connected lobby: ${socket.id} ${socket.user.userName}`);

  // logout duplicate sessions
  if (socket.user.userStatus !== 'offline') {
    console.log('[socket.service] duplicate login detected! ', socket.user.socketId);
    io.to(socket.user.socketId).emit('force-logout', {
      message: `Logged in at another device, logging out now...`,
      timestamp: new Date().toISOString()
    });
  }
  else
    console.log('[socket.service] new login!')

  setTimeout(() => {
    updateSocketId(socket.id, socket.user.userId, 'online');
    socket.emit('online-status', { userId: socket.user.userId, status:'online' });
  }, 2000);

  // Initialize player, should this be in db?
  players.set(socket.id, createPlayer({
    id: socket.id,
    userId: socket.user.userId,
    name: socket.user.userName || socket.id,
    dpId: socket.user?.department?.dpId || 'guest',
    roomName: null,
    position: { x:0, y:0, z:0 },
    rotation: { x:-Math.PI/2, y:0, z:0 },
    color: randomHslColor(),
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
    // target = players.get(data.id)
    // console.log('[player-move] target! ', target, ' ', data.userId);
    if (target && target.roomName) {
      target.position = data.position; // ### this means user pos not updated?
      // target.rotation = data.rotation;

      // emit position in room name
      socket.to(target.roomName).emit('player-moved', data);
    }
  });
  socket.on('object-move', (data) => {
    let roomData = rooms.get(data.roomName);
    if (!roomData) return;

    const target = Array.from(roomData.objects.values()).find(p => p.userId === data.userId);
    if (target) {
      target.position = data.position;
      // emit to everyone include sender
      io.in(target.roomName).emit('object-moved', data);
      // socket.emit('object-moved', data);
      // io.in(target.roomName).emit('object-moved', data);

      // console.log('[object-move] object! ', data.position, ' ', data.userId);
    }
  });
  socket.on('object-acquire', (data) => {
    let roomData = rooms.get(data.roomName);
    if (!roomData) return;
    
    // data.roomName, data.objectId, data.ownerId
    const target = Array.from(roomData.objects.values()).find(p => p.userId === data.objectId);
    if (!target) return ;

    target.ownership.ownerId = data.ownerId;
    target.ownership.timestamp = data.timestamp;
    io.in(data.roomName).emit('object-acquired', { objectId:data.objectId, ownerId:data.ownerId, timestamp:data.timestamp });
    console.log('Backend [object-acquire] ', data.objectId, ' owned: ', data.ownerId);
  });
  socket.on('object-release', (data) => {
    let roomData = rooms.get(data.roomName);
    if (!roomData) return;
    io.in(data.roomName).emit('object-released', { objectId:data.objectId });
    console.log('Backend [object-released] ', data.objectId);
  });

  // Event handler for joining rooms
  socket.on('join-room', async ({ roomName }) => {
    if (!player) {
      console.log('Backend[join-room]: player not found on map')
      return ;
    } 
    let roomData = rooms.get(roomName);
    
    // should validate room name & user access permission
    // ...
    // create if no room
    if (!roomData) {
      roomData = await initializeRoomData(rooms, roomName);
      console.log('[socket.service] new room!');
    }

    // Room-size constrains
    const roomSize = 20;
    if (roomData.users.length > roomSize) {
      socket.emit('room-full', { roomName, maxSize:roomSize });
      console.log('Room Full: current users: ', roomData.users)
      return;
    }

    player.roomName = roomName;

    if (roomData?.users) {
      const existingUserIdx = roomData?.users.findIndex(u => u.userId === player.userId);
      console.log('[socket] existingUserIdx ', existingUserIdx);
      if (existingUserIdx !== -1)
        roomData.users[existingUserIdx] = player; // replace
      else
        roomData.users.push(player);
    }
    else
      roomData.users.push(player); // append entire player obj
    socket.join(roomName);
    socket.emit('existing-room-players', roomData?.users || []); // send only to client
    socket.emit('existing-room-objects', roomData?.objects || []);
    // console.log('[existing-room-objects] ', roomData?.objects);
    
    // Generate room-specific token
    const token = await generateRoomToken(roomName, player.id, player.name); // ###

    // either setRoomPlayers in existing-room-players or room-joined
    socket.emit('room-joined', {
      roomName,
      token,
      player,
      participants: roomData.users, // all participants
      isCreator: roomData.users.length === 1
    });
    
    // Notify others in SAME room
    socket.to(roomName).emit('player-joined-room', {
      player,
      roomName,
      participantCount: roomData.users.length
    });
    console.log(`${player.name} joined room: ${player.roomName}`);
  });

	// Get existing players in room
  socket.on('request-room-players', async ({ roomName }) => {
    let roomData = rooms.get(roomName);
    if (!roomData) {
      socket.emit('existing-room-players', []);
      return ;
    }
    socket.emit('existing-room-players', roomData?.users || []);
    console.log('[existing-room-players] ', roomData?.users || []);
  });

  // Handle leaving specific room
  socket.on('leave-room', ({ roomName }) => {
    if (!player) { console.log('player not found'); return; }
    handleLeaveRoom(socket, player, roomName);
  });
	
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    if (player.roomName)
      handleLeaveRoom(socket, player, player.roomName)
    players.delete(socket.id);
    socket.broadcast.emit('player-left', { id:socket.id }); // send to all clients globally
    updateSocketId(socket.id, socket.user.userId, 'offline');
    socket.emit('online-status', {status: 'offline'});
  });

  /* *****************************************************************
   * Setup Socket Functions
   * ****************************************************************/

  function handleLeaveRoom(socket, player, roomName) {
    if (!player) return ;

    const roomData = rooms.get(roomName);
    if (roomData) {
      const playerExists = roomData.users.some(u => u.id === player.id); //#####
      if (!playerExists) {
        console.log('player not found in ', roomData.name, 'skipping ...' );
        return ;
      }
      console.log('Backend: leave-room, user count bf: ', roomData.users.length)
      roomData.users = roomData.users.filter(u => u.id !== player.id); // remove user from room
      console.log('Backend: leave-room, user count af: ', roomData.users.length)
      console.log('Backend: leave-room, users now: ', roomData.users)

      socket.leave(roomName);
      player.roomName = null;

      // Notify room members
      socket.to(roomName).emit('player-left-room', { 
        id: player.id,
        roomName,
        playerName: player.name,
      });
      
      // Clean up empty rooms
      if (roomData.users.length === 0) {
        rooms.delete(roomName);
        console.log(`Room ${roomName} closed.`);
      }
    }
  }
  // within io
});
// within socket
}

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