const router = require('express').Router();
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');
const activityController = require('../controllers/activity.controller');

// all routes require authentication (must be logged in)
router.use(authMiddleware);

// admin only
router.get('/', requireAdmin, activityController.getAllActivities);
router.get('/recent', requireAdmin, activityController.getRecentActivities);
router.get('/export', requireAdmin, activityController.exportActivities);

module.exports = router;
