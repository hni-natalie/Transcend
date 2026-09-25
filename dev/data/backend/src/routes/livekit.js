const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = require('../utils/secrets');
const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');
const { limiterMiddleware } = require('../middleware/limiter.middleware');
const { authMiddleware } = require('../middleware/auth.middleware');
const prisma = require('../../prisma/client');

const router        = require('express').Router();
const roomService   = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

const tokenLimiter = limiterMiddleware(60 * 1000, 10, { error: 'Too many token requests, try again later.' });

router.use(authMiddleware);

async function generateRoomToken(roomName, participantIdentity, participantName) {
    if (!roomName || !participantIdentity || !participantName) {
        throw new Error('Missing token information');
    }
    
    const at = new AccessToken(
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET,
        {
            identity: participantIdentity,
            name: participantName,
            ttl: '6h', // token expiration
        }
    );
    
    // Add grants (permissions)
    at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,      // Allow publishing audio/video
        canSubscribe: true,    // Allow viewing others
        canPublishData: true,  // Allow sending chat/data
    });
    const token = await at.toJwt();
    return ( token );
}

/* *****************************************************************
 * Setup Routes
 * ****************************************************************/

// > GET : frontend calls this to get a token
router.get('/token', tokenLimiter, async (req, res) => {
    const { roomName } = req.query;
    const userId = req.user.userId;

    if (!roomName)
        return res.status(400).json({ error: 'Missing roomName' });

    try {
        const meeting = await prisma.meeting.findFirst({
            where: {
                meetId: roomName,
                OR: [
                    { createdByUserId: userId },
                    {
                        participants: {
                            some: { userId }
                        }
                    }
                ]
            }
        });

        if (!meeting) {
            return res.status(403).json({
                error: 'You are not allowed to join this meeting'
            });
        }

        const participantIdentity = req.user.userId;
        const participantName = req.user.userName;

        const token = await generateRoomToken(
            roomName, participantIdentity, participantName
        );

        res.json({ token });

    } catch (error) {
        console.error('Token generation failed:', error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

// roomName:string, participantIdentity:string, mute:boolean
router.post('/mute-user', async (req, res) => {
    try {
        const { roomName, mute } = req.body;
        const userId = req.user.userId;

        if (!roomName || typeof mute !== 'boolean')
            return res.status(400).json({ error: 'Invalid request' });

        await roomService.mutePublishedTrack(
            roomName,
            userId,
            'audio',
            mute
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to mute user:', error);

        res.status(500).json({ error: 'Failed to update microphone status' });
    }
});

// create room with custom settings
router.post('/create-room', async (req, res) => {
    try {
        const { roomName, maxParticipants } = req.body;

        if (!roomName)
            return res.status(400).json({ error: 'Missing roomName' });

        const room = await roomService.createRoom({
            name: roomName, maxParticipants
        });

        res.json({ room });
    } catch (error) {
        console.error('Failed to create room:', error);
        res.status(500).json({
            error: 'Failed to create room'
        });
    }
});

module.exports = { router, generateRoomToken };