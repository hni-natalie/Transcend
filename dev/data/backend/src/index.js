const express = require('express');
const pool = require('./db');
const seedAdmin = require('./seed');

const app = express();
const port = process.env.BACKEND_PORT || 3000;

app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
	res.json({ message: 'Hello from Express + Docker!' });
});

app.get('/health', async (req, res) => {
	try {
		await pool.query('SELECT 1')   // no connection needed, pool handles it
		res.json({ status: 'healthy', database: 'connected' })
		} catch (err) {
		res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: err.message })
		}
	})

// app.get('/health', async (req, res) => {
// 	try {
// 		const conn = await pool.getConnection();
// 		await conn.query('SELECT 1');
// 		conn.release();
// 		res.json({ status: 'healthy', database: 'connected' });
// 	} catch (err) {
// 		res.status(500).json({ status: 'healthy', database: 'disconnected', error: err.message });
// 	}
// });

app.listen(port, async () => {
    console.log(`Server running on port ${port}`);
    await seedAdmin();
});