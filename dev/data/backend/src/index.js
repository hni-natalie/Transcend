const express = require('express');
const prisma = require('../prisma/client')

const app = express();
const port = process.env.BACKEND_PORT;

app.use(express.json());

// routes
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

const roleRoutes = require('./routes/role.routes');
app.use('/api/roles', roleRoutes);

const userRoutes = require('./routes/user.routes');
app.use('/api/users', userRoutes);

const departmentRoutes = require('./routes/department.routes');
app.use('/api/departments', departmentRoutes);

// const spaceRoutes = require('./routes/space.routes');
// app.use('/api/spaces', spaceRoutes);

// const taskRoutes = require('./routes/task.routes');
// app.use('/api/tasks', taskRoutes);

// const meetingRoutes = require('./routes/meeting.routes');
// app.use('/api/meetings', meetingRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Hello from Express + Docker!' });
});

// Health check using Prisma
app.get('/health', async (req, res) => {
    try {
        // Test database connection with Prisma
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'healthy', database: 'connected' });
    } catch (err) {
        res.status(500).json({ 
            status: 'unhealthy', 
            database: 'disconnected', 
            error: err.message 
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Graceful shutdown - close prisma connection when app stops
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});