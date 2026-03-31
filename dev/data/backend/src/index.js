const express = require('express');
const pool = require('./db');

const app = express();
const port = process.env.BACKEND_PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
	res.json({ message: 'Hello from Express + Docker!' });
});

app.get('/health', async (req, res) => {
	try {
		const conn = await pool.getConnection();
		await conn.query('SELECT 1');
		conn.release();
		res.json({ status: 'healthy', database: 'connected' });
	} catch (err) {
		res.status(500).json({ status: 'healthy', database: 'disconnected', error: err.message });
	}
});

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});