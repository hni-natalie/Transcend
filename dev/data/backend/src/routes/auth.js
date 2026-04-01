const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const JWT_SECRET = fs.readFileSync('/run/secrets/jwt_secret', 'utf8').trim();

// POST /auth/register
router.post('/register', async (req, res) => {
    const { user_name, user_email, user_password, role_id } = req.body;

    try {
        const hash = await bcrypt.hash(user_password, 10);
        const conn = await pool.getConnection();
        await conn.query(
            'INSERT INTO user (user_name, user_email, user_password, role_id) VALUES (?, ?, ?, ?)',
            [user_name, user_email, hash, role_id]
        );
        conn.release();
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /auth/login
router.post('/login', async (req, res) => {
    const { user_email, user_password } = req.body;

    try {
        const conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM user WHERE user_email = ?', [user_email]);
        conn.release();

        if (rows.length === 0)
            return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        const match = await bcrypt.compare(user_password, user.user_password);
        if (!match)
            return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
			{ user_id: user.user_id, role_id: user.role_id },
			JWT_SECRET,
			{ expiresIn: '24h' }
		);
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /auth/me
router.get('/me', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token)
        return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const conn = await pool.getConnection();
        const rows = await conn.query('SELECT user_id, user_name, user_email, user_status, role_id FROM user WHERE user_id = ?', [decoded.user_id]);
        conn.release();
        res.json(rows[0]);
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;