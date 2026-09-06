const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const recordingController = require('../controllers/recording.controller');

router.use(authMiddleware);

router.post('/start', recordingController.startRecording);
router.patch('/stop/:meetId', recordingController.stopRecording);
router.post('/finalize', recordingController.finalizeRecordings);
router.get('/:meetId', recordingController.getRecordings);
router.get("/status/:meetId", recordingController.getRecordingStatus);

module.exports = router;