const fs = require('fs');
const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth.middleware');

const JWT_SECRET = fs.readFileSync('/run/secrets/jwt_secret', 'utf8').trim();

// POST /auth/login — email login
router.post('/login', async (req, res) => {
	const { user_email, user_password } = req.body

	try {
		const result = await pool.query(
		'SELECT * FROM users WHERE user_email = $1',
		[user_email]
		)

		if (result.rows.length === 0)
		return res.status(401).json({ error: 'Invalid credentials' })

		const user = result.rows[0]

		if (!user.user_password)
		return res.status(401).json({ error: 'Please login with Google' })

		const match = await bcrypt.compare(user_password, user.user_password)
		if (!match)
		return res.status(401).json({ error: 'Invalid credentials' })

		const token = jwt.sign(
		{ user_id: user.user_id, role_id: user.role_id },
		JWT_SECRET,
		{ expiresIn: '24h' }
		)

		// ← return user alongside token
		res.json({
		token,
		user: {
			user_id: user.user_id,
			user_name: user.user_name,
			user_email: user.user_email,
			role_id: user.role_id,
			user_status: user.user_status,
			avatar_url: user.avatar_url
		}
		})
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
	})

	// POST /auth/google — OAuth login
	router.post('/google', async (req, res) => {
	const { oauth_id, user_email, user_name, avatar_url } = req.body  // ← fixed typo

	try {
		let result = await pool.query(
		'SELECT * FROM users WHERE oauth_id = $1 OR user_email = $2',
		[oauth_id, user_email]
		)

		let user

		if (result.rows.length === 0) {
		const newUser = await pool.query(
			`INSERT INTO users (user_name, user_email, oauth_provider, oauth_id, avatar_url, role_id)
			VALUES ($1, $2, 'google', $3, $4, 2)
			RETURNING user_id, user_name, user_email, role_id, avatar_url`,
			[user_name, user_email, oauth_id, avatar_url]
		)
		user = newUser.rows[0]
		} else {
		user = result.rows[0]

		if (!user.oauth_id) {
			await pool.query(
			`UPDATE users SET oauth_provider = 'google', oauth_id = $1, avatar_url = $2
			WHERE user_id = $3`,
			[oauth_id, avatar_url, user.user_id]
			)
		}
		}

		const token = jwt.sign(
		{ user_id: user.user_id, role_id: user.role_id },
		JWT_SECRET,
		{ expiresIn: '24h' }
		)

		// return user alongside token
		res.json({
		token,
		user: {
			user_id: user.user_id,
			user_name: user.user_name,
			user_email: user.user_email,
			role_id: user.role_id,
			avatar_url: user.avatar_url
		}
		})
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
	})

	// GET /auth/me — get current user from token
	router.get('/me', auth, async (req, res) => {
	try {
		const result = await pool.query(
		`SELECT user_id, user_name, user_email, role_id, user_status, avatar_url
		FROM users WHERE user_id = $1`,  // ← added user_status, avatar_url
		[req.user.user_id]
		)

		if (result.rows.length === 0)
		return res.status(404).json({ error: 'User not found' })

		res.json({ data: result.rows[0] })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
	})

module.exports = router;
