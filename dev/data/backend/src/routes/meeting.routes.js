const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const meetingController = require('../controllers/meeting.controller');

// all routes require authentication (must be logged in)
router.use(authMiddleware);

router.get('/', meetingController.getAllMeetings);
router.get('/user/:userId', meetingController.getMeetingByUserId);
router.get('/participant/:userId', meetingController.getMeetingByParticipantId);
router.get('/pin', meetingController.getAllMeetingPin);
router.get('/:meetingId', meetingController.getMeetingById);

router.patch('/pin/:meetId', meetingController.toggleMeetingPin);

router.post('/', meetingController.createMeeting);

router.put('/', meetingController.updateMeeting);
router.put('/participant', meetingController.updateParticipant);

router.delete('/participant', meetingController.removeParticipant);
router.delete('/:meetId', meetingController.deleteMeeting);

module.exports = router;