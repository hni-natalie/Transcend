const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const meetingController = require('../controllers/meeting.controller');

// all routes require authentication (must be logged in)
router.use(authMiddleware);

router.get('/', meetingController.getAllMeetings);
router.get('/:meetingId', meetingController.getMeetingById);
router.get('/:userId', meetingController.getMeetingByUserId);

router.post('/', meetingController.createMeeting);
router.post('/participant', meetingController.addParticipant);

router.put('/', meetingController.updateMeeting);
router.put('/participant', meetingController.updateParticipant);

router.delete('/:meetId', meetingController.deleteMeeting);
router.delete('/participant/:meetId/:targetUserId', meetingController.removeParticipant);

module.exports = router;