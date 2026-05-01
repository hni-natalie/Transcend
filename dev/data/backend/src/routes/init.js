/*
 routes for initialization or testing
*/
const router = require('express').Router();
const prisma = require('../../prisma/client');

router.get('/', (req, res) => {
  res.json({ message: 'Hello from Express + Docker!' });
});

router.get('/health', async (req, res) => {
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

module.exports = router;
