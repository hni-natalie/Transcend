const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = require('../utils/secrets');
const { AccessToken } = require('livekit-server-sdk');
const router          = require('express').Router();


// > GET : frontend calls this to get a token
router.get('/token', async (req, res) => {
    const { roomName, participantName } = req.query;
    
    // Validate inputs
    if (!roomName || !participantName) {
        return res.status(400).json({ error: 'Missing roomName or participantName' });
    }
    
    try {
        // Create access token
        const at = new AccessToken(
            LIVEKIT_API_KEY,
            LIVEKIT_API_SECRET,
            {
                identity: participantName,
                // Token expires in 6 hours by default
                ttl: '6h',
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
        res.json({ token });
    } catch (error) {
        console.error('Token generation failed:', error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

module.exports = router;