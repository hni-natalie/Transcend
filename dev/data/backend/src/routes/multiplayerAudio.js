
// interface Player {
//   id: string;
//   position: { x:number; y:number; z:number };
//   rotation: number;
//   color: string;
// }
/* **************************************************************** */

const { randomHslColor } = require('../utils/color.js');
const router = require('express').Router();
const players = new Map();
const rooms = new Map(); // Map<roomName, RoomData>

const { generateRoomToken } = require('./livekit')
// socket io setup
const setupPlayerSocket = (io) => {
	io.on('connection', (socket) => {
  console.log(`Player connected lobby: ${socket.id}`);
  
  // Initialize player
  players.set(socket.id, {
    id: socket.id,
    // name: 'GetUsersNameAPI',
    name: new Date().toISOString(),
    roomName: null,            // default is lobby
    position: { x:0, y:0, z:0 },  //use Object
    rotation: 0,
    color: randomHslColor(),
    audioEnabled: true,
    speaking: false,
  });

  // Send current players to new connection
  socket.emit('existing-players', Array.from(players.values()));
  
  // Broadcast new player to everyone else
  // frontend sets up receiver & do next steps: eg print names
  socket.broadcast.emit('player-joined', players.get(socket.id));
  
  // Handle position updates
  socket.on('player-move', (data) => {
    const player = players.get(socket.id);
    if (player && player.roomName) {
      player.position = data.position;
      player.rotation = data.rotation;

      // pending, might need to remove this
      socket.broadcast.emit('player-moved', data);
      // emit position in room name
      socket.to(player.roomName).emit('user-moved', data);
    }
  });

  // Event handler for joining rooms
  socket.on('join-room', async ({ roomName }) => {
    const player = players.get(socket.id);
    if (!player) return ;
    
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
    if (roomData.users.length >= 20) {
      socket.emit('room-full', { roomName });
      return;
    }
    
    // if ok, add roomName to player
    // const playerExists = roomData.users.some(u => u.id === socket.id);
    // if (playerExists) {
    //   console.log('player is in ', roomData.name, 'exiting ...' );
    //   return ;
    // }

    player.roomName = roomData.name;
    roomData.users.push({ id:socket.id, name:player.name});
    socket.join(roomName);
    
    // Generate room-specific token
    const token = await generateRoomToken(roomName, player.name);
    // Send room-joined event with room context
    socket.emit('room-joined', {
      roomName,        // Important: identifies WHICH room
      token,
      participants: roomData.users.filter(u => u.id !== socket.id),
      isCreator: roomData.users.length === 1
    });
    
    // Notify others in SAME room
    socket.to(roomName).emit('player-joined-room', {
      roomName,
      playerName: player.name,
      participantCount: roomData.users.length
    });
    
    console.log(`${player.name} joined room: ${roomName}`);
  });

	// Get all players
	// socket.on('getPlayers', () => {
	// 	socket.emit('playersList', Array.from(players.values()));
	// });
  
  // ========== WebRTC Signaling ==========
  // Handle call initiation
  // socket.on('call-user', (data) => {
  //   console.log(`Call from ${socket.id} to ${data.to}`);
  //   io.to(data.to).emit('incoming-call', {
  //     from: socket.id,
  //     offer: data.offer
  //   });
  // });
  
  /**********************************************************
   * voice modules
   ********************************************************** */
  // receive voice from peers
  // socket.on('voice-offer', (data) => {
  //   socket.to(data.targetId).emit('voice-offer', data.offer);
  // });
  // // broadcast voice to peers
  // socket.on('voice-answer', (data) => {
  //   socket.to(data.targetId).emit('voice-answer', data.offer);
  // });
  // // broadcast voice to peers
  // socket.on('voice-ice-candidate', (data) => {
  //   socket.to(data.targetId).emit('voice-ice-candidate', data.offer);
  // });
  
  // // Handle call acceptance
  // socket.on('accept-call', (data) => {
  //   console.log(`Call accepted from ${socket.id} to ${data.to}`);
  //   io.to(data.to).emit('call-accepted', {
  //     from: socket.id,
  //     answer: data.answer
  //   });
  // });
  
  // // Handle ICE candidates for NAT traversal
  // socket.on('ice-candidate', (data) => {
  //   io.to(data.to).emit('ice-candidate', {
  //     from: socket.id,
  //     candidate: data.candidate
  //   });
  // });

  // Handle leaving specific room
  socket.on('leave-room', ({ roomName }) => {
    const player = players.get(socket.id);
    if (!player) return ;

    const roomData = rooms.get(roomName);
    if (roomData) {
      const playerExists = roomData.users.some(u => u.id === socket.id);
      if (!playerExists) {
        console.log('player not found in ', roomData.name, 'skipping ...' );
        return ;
      }
      console.log('Backend: leave-room')
      roomData.users = roomData.users.filter(u => u.id !== socket.id);
      socket.leave(roomName);
      player.roomName = null;
      
      // Notify room members
      socket.to(roomName).emit('player-left-room', { roomName });
      
      // Clean up empty rooms
      if (roomData.users.length === 0) {
        rooms.delete(roomName);
        console.log(`Room ${roomName} closed.`);
      }
    }
  });
	
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    players.delete(socket.id);
    socket.broadcast.emit('player-left', { id:socket.id });
  });
});
}

// setup routes
router.get('/', (req, res) => {
	res.json({
		count: players.size,
		players: Array.from(players.values())
	});
});

module.exports = {
	players,
	setupPlayerSocket,
	router
};