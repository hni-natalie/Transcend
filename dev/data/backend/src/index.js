const express = require('express');
const { PrismaClient } = require('../prisma/client');

const app = express();
const port = process.env.BACKEND_PORT;

app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

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

// Graceful shutdown - close Prisma connection when app stops
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});