const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const authController = require('../controllers/auth.controller');

router.post('/login', authController.login);
router.post('/google', authController.google);
router.get('/me', authMiddleware, authController.me);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;