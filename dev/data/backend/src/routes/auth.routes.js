// auth.routes
const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { limiterMiddleware } = require('../middleware/limiter.middleware');
const authController = require('../controllers/auth.controller');

const authLimiter = limiterMiddleware(60 * 1000, 5, { error: '[auth] Too many attempts, try again later.' });

router.post('/login', authLimiter, authController.login);
router.post('/google', authLimiter, authController.google);
router.get('/me', authMiddleware, authController.me);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;