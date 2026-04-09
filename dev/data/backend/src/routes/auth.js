const fs = require('fs');
const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth.middleware');

const JWT_SECRET = fs.readFileSync('/run/secrets/jwt_secret', 'utf8').trim();

// POST /auth/login — email login
router.post('/login', async (req, res) => {
    const { userEmail, userPassword } = req.body;

    try {
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { userEmail },
            include: { role: true }
        });

        if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.userPassword) {
        return res.status(401).json({ error: 'Please login with Google' });
        }

        const match = await bcrypt.compare(userPassword, user.userPassword);
        if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
        { userId: user.userId, roleId: user.roleId },
        JWT_SECRET,
        { expiresIn: '24h' }
        );

        res.json({
        token,
        user: {
            userId: user.userId,
            userName: user.userName,
            userEmail: user.userEmail,
            roleId: user.roleId,
            roleName: user.role.roleName,
            userStatus: user.userStatus,
            avatarUrl: user.avatarUrl || null,
        },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    });

    // POST /auth/google — OAuth login
    router.post('/google', async (req, res) => {
    const { oauthId, userEmail, userName, avatarUrl } = req.body;

    try {
        // Find existing user by Google ID or email
        let user = await prisma.user.findFirst({
        where: {
            OR: [
            { googleId: oauthId },
            { userEmail },
            ],
        },
        include: { role: true }
        });

        if (!user) {
        // Get default role and department
        const defaultRole = await prisma.role.findUnique({ where: { roleName: 'User' } });
        const defaultDept = await prisma.department.findFirst();

        if (!defaultRole || !defaultDept) {
            return res.status(500).json({ error: 'Default role or department not found' });
        }

        // Create new Google user
        user = await prisma.user.create({
            data: {
            userName,
            userEmail,
            googleId: oauthId,
            authProvider: 'google',
            roleId: defaultRole.roleId,
            dpId: defaultDept.dpId,
            avatarUrl,
            emailVerified: true,
            userStatus: 'offline',
            },
            include: { role: true }
        });
        } else if (!user.googleId) {
        // Link Google to existing user
        user = await prisma.user.update({
            where: { userId: user.userId },
            data: {
            googleId: oauthId,
            authProvider: 'google',
            avatarUrl,
            },
            include: { role: true }
        });
        }

        const token = jwt.sign(
        { userId: user.userId, roleId: user.roleId },
        JWT_SECRET,
        { expiresIn: '24h' }
        );

        res.json({
        token,
        user: {
            userId: user.userId,
            userName: user.userName,
            userEmail: user.userEmail,
            roleId: user.roleId,
            roleName: user.role.roleName,
            avatarUrl: user.avatarUrl || null,
        },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    });

    // GET /auth/me — get current user from token
    router.get('/me', auth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
        where: { userId: req.user.userId },
        include: { role: { select: { roleName: true } } }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
        data: {
            userId: user.userId,
            userName: user.userName,
            userEmail: user.userEmail,
            roleId: user.roleId,
            roleName: user.role.roleName,
            userStatus: user.userStatus,
            avatarUrl: user.avatarUrl || null
        }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;