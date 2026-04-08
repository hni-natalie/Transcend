const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const dotenv     = require('dotenv');
const path       = require('path');
const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = require('./utils/secrets');


dotenv.config({ path: path.join(__dirname, '../../../.env') });
const app    = express();
const port   = process.env.BACKEND_PORT || 3000;
const server = http.createServer(app);
const io     = new Server(server, {
  cors: {
    origin: process.env.VITE_DOMAIN_URL || "https://localhost"
  },
  path: process.env.VITE_SOCKET_PATH || "/socket.io",
});
console.log('Socket.IO created with path:', io.path());
const multiplayer = require('./routes/multiplayerAudio')
multiplayer.setupPlayerSocket(io)


/* *************************************************
 * import routes
 * *************************************************/
const routesInit = require('./routes/init')
const routesLivekit = require('./routes/livekit')

/* *************************************************
 * all used routes
 * *************************************************/
app.use('/', routesInit)
app.use('/lk', routesLivekit)
app.use('/player', multiplayer.router)

// start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
