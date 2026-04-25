const express    = require('express');
const prisma     = require('../prisma/client');
const http       = require('http');
const { Server } = require('socket.io');
const dotenv     = require('dotenv');
const path       = require('path');

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
const multiplayer = require('./services/socket.service')
multiplayer.socketService(io)

/* *************************************************
 * import routes
 * *************************************************/
const routesInit       = require('./routes/init')
const routesLivekit    = require('./routes/livekit').router
const authRoutes       = require('./routes/auth.routes');
const roleRoutes       = require('./routes/role.routes');
const roomRoutes       = require('./routes/room.routes');
const userRoutes       = require('./routes/user.routes');
const departmentRoutes = require('./routes/department.routes');
const uploadRoutes     = require('./routes/upload.routes');
// const spaceRoutes = require('./routes/space.routes');
const taskRoutes = require('./routes/task.routes');
// const meetingRoutes = require('./routes/meeting.routes');

/* *************************************************
* all used routes
* *************************************************/
app.use(express.json());  // For parsing JSON
app.use('/api', routesInit)
app.use('/api/lk', routesLivekit)
app.use('/api/player', roomRoutes)
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/departments', departmentRoutes);
// app.use('/api/spaces', spaceRoutes);
app.use('/api/tasks', taskRoutes);
// app.use('/api/meetings', meetingRoutes);

// start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown - close prisma connection when app stops
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});