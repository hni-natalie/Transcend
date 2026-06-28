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

const { generateRoomToken } = require('../routes/livekit.js')
const { randomHslColor }    = require('../utils/color.js');
const { apiClient }         = require('../api/api.client.js')
const { updateSocketId }    = require('./supabase-storage.service.js')
const players     = new Map();
const rooms       = new Map();      // Map<roomName, roomPlayers>

// socket io setup
const socketService = (io) => {
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
  if (socket.user.userStatus === 'online') {
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
  }, 3000);

  // Initialize player, should this be in db?
  players.set(socket.id, {
    id: socket.id,
    userId: socket.user.userId,
    name: socket.user.userName || socket.id, // 'GetUsersNameAPI'
    roomName: null,
    position: { x:0, y:0, z:0 },
    rotation: { x:-Math.PI/2, y:0, z:0 },
    color: randomHslColor(),
    photo: socket.user.avatarUrl || null,
    audioEnabled: true,
    speaking: false,
  });
  const player = players.get(socket.id);

  // Send current players to new connection
  socket.emit('existing-players', Array.from(players.values()));
  
  // Broadcast entire new player object to everyone else
  socket.broadcast.emit('player-joined', players.get(socket.id));
  
  // Handle position updates
  socket.on('player-move', (data) => {
    if (player && player.roomName) {
      player.position = data.position;
      player.rotation = data.rotation;

      // emit position in room name
      socket.to(player.roomName).emit('player-moved', data);
    }
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
      roomData = {
        name: roomName,
        users: [],
        createdAt: Date.now()
      };
      rooms.set(roomName, roomData);
    }

    // Room-size constrains
    if (roomData.users.length > 3) {
      socket.emit('room-full', { roomName, maxSize:3 });
      console.log('Room Full: current users: ', roomData.users)
      return;
    }

    player.roomName = roomName;
    roomData.users.push(player); // append entire player obj
    socket.join(roomName);
    socket.emit('existing-room-players', roomData?.users || []); // send only to client

    
    // Generate room-specific token
    const token = await generateRoomToken(roomName, player.name);

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
    updateSocketId(null, socket.user.userId, 'offline');
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

module.exports = {
	players,
	socketService,
};