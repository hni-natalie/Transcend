const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const prisma = require('../../prisma/client');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = fs.readFileSync('/run/secrets/jwt_secret', 'utf8').trim();
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1d';

// google oauth client
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken) {
    const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: GOOGLE_CLIENT_ID
    });
    return ticket.getPayload();
}

// POST /auth/login — email login
router.post('/login', async (req, res) => {
    const { userEmail, userPassword } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { userEmail },
            include: { role: true }
        });

        if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!user.userPassword) {
        return res.status(401).json({ error: 'Please login with Google' });
        }

        const match = await bcrypt.compare(userPassword, user.userPassword);
        if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
        { 
            userId: user.userId, 
            roleId: user.roleId,
            roleName: user.role.roleName,
            workspaceId: user.workspaceId,  // added to retrieve workspaceid when creating task (YJ)
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
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

// POST /auth/google — OAuth login (only existing users)
router.post('/google', async (req, res) => {
    const { idToken } = req.body;

    try {
        // verify google token
        let payload;
        try {
            payload = await verifyGoogleToken(idToken);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid Google token' });
        }

        // extract user info
        const { sub: googleId, email: userEmail, picture: avatarUrl } = payload;

        // find user by email (must exist already)
        let user = await prisma.user.findUnique({
            where: { userEmail: userEmail },
            include: { role: true }
        });

        // if email doesnt exist > reject login
        if (!user) {
            return res.status(401).json({ 
                error: 'No account found with this email. Please contact your administrator.' 
            });
        }

        // if user exists but no googleId yet > link google account
        if (!user.googleId) {
            user = await prisma.user.update({
                where: { userId: user.userId },
                data: {
                    googleId: googleId,
                    authProvider: 'google',
                    avatarUrl: avatarUrl || user.avatarUrl,
                },
                include: { role: true }
            });
        } else if (user.googleId !== googleId) {
            // security: google id mismatch
            return res.status(401).json({ 
                error: 'This email is linked to a different Google account.' 
            });
        }

        // generate app's JWT
        const token = jwt.sign(
            { 
                userId: user.userId, 
                roleId: user.roleId,
                roleName: user.role.roleName, 
                workspaceId: user.workspaceId, // added to retrieve workspaceid when creating task (YJ)
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
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

// GET /auth/me — get current user from token
router.get('/me', authMiddleware, async (req, res) => {
    try {
        // req.user comes from authMiddleware (has userId, roleId, roleName)
        const user = await prisma.user.findUnique({
            where: { userId: req.user.userId },
            select: {
                userId: true,
                userName: true,
                userEmail: true,
                roleId: true,
                role: {
                    select: { roleName: true }
                },
                userStatus: true,
                avatarUrl: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return stable shape that matches login endpoint
        res.json({
            userId: user.userId,
            userName: user.userName,
            userEmail: user.userEmail,
            roleId: user.roleId,
            roleName: user.role.roleName,
            userStatus: user.userStatus,
            avatarUrl: user.avatarUrl ?? null,  // Use ?? instead of ||
            createdAt: user.createdAt
        });
    } catch (err) {
        console.error('Error in /me:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /auth/logout — logout (client just discards token)
router.post('/logout', authMiddleware, async (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;