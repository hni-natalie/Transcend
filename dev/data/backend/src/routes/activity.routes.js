const router = require('express').Router();
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');
const activityController = require('../controllers/activity.controller');

router.use(authMiddleware);

router.get('/', requireAdmin, activityController.getAllActivities);
router.get('/recent', requireAdmin, activityController.getRecentActivities);
router.get('/export', requireAdmin, activityController.exportActivities);

module.exports = router;
