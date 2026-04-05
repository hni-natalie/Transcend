
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


// socket io setup
const setupPlayerSocket = (io) => {
	io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Initialize player
  players.set(socket.id, {
    id: socket.id,
    name: 'GetUsersNameAPI',
    position: { x:0, y:0, z:0 }, //use Object
    rotation: 0,
    color: randomHslColor()
  });

  // Send current players to new connection
  socket.emit('existing-players', Array.from(players.values()));
  
  // Broadcast new player to everyone else
  socket.broadcast.emit('player-joined', players.get(socket.id));
  
  // Handle position updates
  socket.on('player-move', (data) => {
    const player = players.get(socket.id);
    if (player) {
      player.position = data.position;
      player.rotation = data.rotation;
      socket.broadcast.emit('player-moved', data);
      console.log('Broadcast movement to all players')
    }
  });
  
  // ========== WebRTC Signaling ==========
  // Handle call initiation
  socket.on('call-user', (data) => {
    console.log(`Call from ${socket.id} to ${data.to}`);
    io.to(data.to).emit('incoming-call', {
      from: socket.id,
      offer: data.offer
    });
  });
  
  // Handle call acceptance
  socket.on('accept-call', (data) => {
    console.log(`Call accepted from ${socket.id} to ${data.to}`);
    io.to(data.to).emit('call-accepted', {
      from: socket.id,
      answer: data.answer
    });
  });
  
  // Handle ICE candidates for NAT traversal
  socket.on('ice-candidate', (data) => {
    io.to(data.to).emit('ice-candidate', {
      from: socket.id,
      candidate: data.candidate
    });
  });
  
	// Get all players
	socket.on('getPlayers', () => {
		socket.emit('playersList', Array.from(players.values()));
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