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
const players     = new Map();
const rooms       = new Map();      // Map<roomName, roomPlayers>

// socket io setup
const socketService = (io) => {
	io.on('connection', (socket) => {
  console.log(`Player connected lobby: ${socket.id}`);
  
  // Initialize player, should this be in db?
  players.set(socket.id, {
    id: socket.id,
    name: socket.id, // 'GetUsersNameAPI'
    roomName: null,
    position: { x:0, y:0, z:0 },
    rotation: { x:-Math.PI/2, y:0, z:0 },
    color: randomHslColor(),
    // photo: 'GetUserPhotoAPI'
    photo: "https://images.pexels.com/photos/36393879/pexels-photo-36393879.jpeg",
    audioEnabled: true,
    speaking: false,
  });
  const player = players.get(socket.id);

  // Send current players to new connection
  socket.emit('existing-players', Array.from(players.values()));
  
  // Broadcast entire new player object to everyone else
  // frontend sets up listener & do next steps: eg print names
  socket.broadcast.emit('player-joined', players.get(socket.id));
  
  // Handle position updates
  socket.on('player-move', (data) => {
    if (player && player.roomName) {
      player.position = data.position;
      player.rotation = data.rotation;

      // pending, might need to remove this
      socket.broadcast.emit('player-moved', data);
      // emit position in room name
      // socket.to(player.roomName).emit('user-moved', data);
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
    
    // Generate room-specific token
    const token = await generateRoomToken(roomName, player.name);
    // Send room-joined event with room context
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
  socket.on('existing-room-players', async ({ roomName }) => {
    let roomData = rooms.get(roomName);
    if (!roomData) return ;
    socket.emit('players-in-room', roomData?.users || []);
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
    socket.broadcast.emit('player-left', { id:socket.id });
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
      roomData.users = roomData.users.filter(u => u.id !== player.id); //#####
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
// within socket
});
// within io
}

module.exports = {
	players,
	socketService,
};