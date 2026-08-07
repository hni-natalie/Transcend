const router = require('express').Router();
const multer = require("multer");
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');
const messageController = require('../controllers/message.controller');

router.use(authMiddleware);
const upload = multer({ storage: multer.memoryStorage() });


// Conversations
router.get('/', messageController.getAllConversations);
router.get('/:id', messageController.getConversationById);
router.post('/direct', messageController.createDirectConversation);
router.post('/group', messageController.createGroupConversation);
router.delete('/:id', messageController.deleteConversation);

// // Messages
router.get('/:id/messages', messageController.getMessages);
router.post('/:id/messages', messageController.sendMessage);

// Participants
router.post('/:id/participants', messageController.addParticipant);
router.delete('/:id/participants/:userId', messageController.removeParticipant);

// // Pins
router.post('/:id/pin', messageController.pinConversation);
router.delete('/:id/pin', messageController.unpinConversation);

// // Attachments
router.post('/:id/attachments', upload.single("file"),messageController.uploadAttachment);
router.delete('/attachments/:id', messageController.deleteAttachment);

module.exports = router;
