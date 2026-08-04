const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const meetingController = require('../controllers/meeting.controller');
const meetingChatController = require('../controllers/meetingChat.controller');

// all routes require authentication (must be logged in)
router.use(authMiddleware);

router.get('/', meetingController.getAllMeetings);
router.get('/user/:userId', meetingController.getMeetingByUserId);
router.get('/participant/:userId', meetingController.getMeetingByParticipantId);
router.get('/pin', meetingController.getAllMeetingPin);
router.get('/:meetingId', meetingController.getMeetingById);

router.patch('/pin/:meetId', meetingController.toggleMeetingPin);

router.post('/', meetingController.createMeeting);

router.patch('/', meetingController.updateMeeting);
router.patch('/participants', meetingController.syncParticipants);

router.delete('/:meetId', meetingController.deleteMeeting);

router.patch('/:meetId/start', meetingController.startMeeting);
router.patch('/:meetId/end', meetingController.endMeeting);

router.post('/:meetId/chat', meetingChatController.createChatMessage);
router.get('/:meetId/chat', meetingChatController.getMeetingChat);

module.exports = router;