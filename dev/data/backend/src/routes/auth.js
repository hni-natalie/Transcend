const fs = require('fs');
const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth.middleware');

const JWT_SECRET = fs.readFileSync('/run/secrets/jwt_secret', 'utf8').trim();

// POST /auth/login — email login
router.post('/login', async (req, res) => {
    const { user_email, user_password } = req.body;

    try {
        // find user by email using prisma
        const user = await prisma.users.findUnique({
            where: { user_email: user_email }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.user_password) {
            return res.status(401).json({ error: 'Please login with Google' });
        }

        const match = await bcrypt.compare(user_password, user.user_password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { user_id: user.user_id, role_id: user.role_id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

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
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /auth/google — OAuth login
router.post('/google', async (req, res) => {
    const { oauth_id, user_email, user_name, avatar_url } = req.body;

    try {
        // find existing user by oauth_id / email
        let user = await prisma.users.findFirst({
            where: {
                OR: [
                    { google_id: oauth_id },
                    { user_email: user_email }
                ]
            }
        });

        if (!user) {
            // Create new user with Google OAuth
            // First, get the default role_id (assuming role_name 'User' exists)
            const defaultRole = await prisma.roles.findUnique({
                where: { role_name: 'User' }
            });
            
            // Also need a default department (adjust this as needed)
            const defaultDept = await prisma.departments.findFirst();
            
            if (!defaultRole || !defaultDept) {
                return res.status(500).json({ error: 'Default role or department not found' });
            }

            user = await prisma.users.create({
                data: {
                    user_name: user_name,
                    user_email: user_email,
                    google_id: oauth_id,
                    auth_provider: 'google',
                    role_id: defaultRole.role_id,
                    dp_id: defaultDept.dp_id,
                    avatar_url: avatar_url,
                    email_verified: true,
                    user_status: 'offline'
                }
            });
        } else if (!user.google_id) {
            // Update existing user to link Google account
            user = await prisma.users.update({
                where: { user_id: user.user_id },
                data: {
                    google_id: oauth_id,
                    auth_provider: 'google',
                    avatar_url: avatar_url
                }
            });
        }

        const token = jwt.sign(
            { user_id: user.user_id, role_id: user.role_id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                user_id: user.user_id,
                user_name: user.user_name,
                user_email: user.user_email,
                role_id: user.role_id,
                avatar_url: user.avatar_url
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /auth/me — get current user from token
router.get('/me', auth, async (req, res) => {
    try {
        const user = await prisma.users.findUnique({
            where: { user_id: req.user.user_id },
            select: {
                user_id: true,
                user_name: true,
                user_email: true,
                role_id: true,
                user_status: true,
                avatar_url: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ data: user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;