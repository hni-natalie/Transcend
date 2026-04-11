const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = require('../utils/secrets');
const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');
const router        = require('express').Router();
const roomService   = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);


async function generateRoomToken(roomName, participantName) {
    if (!roomName || !participantName) {
        return res.status(400).json({ error: 'Missing roomName or participantName' });
    }
    const at = new AccessToken(
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET,
        {
            identity: participantName,
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
router.get('/token', async (req, res) => {
    const { roomName, participantName } = req.query;
    
    // Validate inputs
    if (!roomName || !participantName) {
        return res.status(400).json({ error: 'Missing roomName or participantName' });
    }
    try {
        // Create access token
        const token = await generateRoomToken(roomName, participantName);
        res.json({ token });
    } catch (error) {
        console.error('Token generation failed:', error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

// roomName:string, participantIdentity:string, mute:boolean
router.post('/mute-user', async (req, res) => {
  const { roomName, participantIdentity, mute } = req.body;
  
  // Reusing the same 'roomService' instance
  await roomService.mutePublishedTrack(roomName, participantIdentity, 'audio', mute);
  res.json({ success: true });
});

// create room with custom settings
router.post('/create-room', async (req, res) => {
  const { roomName, maxParticipants } = req.body;
  const room = await roomService.createRoom({ name:roomName, maxParticipants:maxParticipants });
  res.json({ room });
});


module.exports = {
    router,
    generateRoomToken
};