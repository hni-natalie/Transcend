const express = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const path       = require('path');

const app    = express();
const port   = process.env.BACKEND_PORT || 3000;
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: "*" },   // Need to disallow * & configure properly for production
  path: "/socket.io",      // ← Set custom path
});
console.log('Socket.IO created with path:', io.path());

const multiplayer = require('./routes/multiplayerAudio')
multiplayer.setupPlayerSocket(io)


/* import different routes */
const routesInit = require('./routes/init')

/* all app routes */
app.use('/', routesInit)
app.use('/player', multiplayer.router)

// start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
