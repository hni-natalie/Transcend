const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const meetingController = require('../controllers/meeting.controller');

// all routes require authentication (must be logged in)
router.use(authMiddleware);

router.get('/', meetingController.getAllMeetings);
router.get('/:meetingId', meetingController.getMeetingById);
router.get('/organiser/:userId', meetingController.getMeetingByUserId);
router.get('/participant/:userId', meetingController.getMeetingByParticipantId);

router.post('/', meetingController.createMeeting);

router.put('/', meetingController.updateMeeting);
router.put('/participant', meetingController.updateParticipant);

router.delete('/:meetId', meetingController.deleteMeeting);
router.delete('/participant', meetingController.removeParticipant);
router.patch('/:meetId/pin', meetingController.toggleMeetingPin);

module.exports = router;