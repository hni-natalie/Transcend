const router = require('express').Router();
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller')

// all routes require authentication (must be logged in)
router.use(authMiddleware);

// self-service (any authenticated user can do these to themselves)
router.get('/password-rules', userController.getPasswordRules);
router.post('/change-password', userController.changePassword);
router.get('/me', userController.getCurrentUser);
router.put('/me', userController.updateCurrentUser);
router.get('/me/data-export', userController.getMyDataExport);
router.post('/me/deletion-request', userController.requestAccountDeletion);
// router.put('/me/avatar', userController.updateAvatar);
router.patch('/status', authMiddleware, userController.updateUserStatus);
router.get('/status/:status', userController.getUsersByStatus);

// admin dashboard specific aggregates
router.get('/dashboard/metrics', requireAdmin, userController.getDashboardMetrics)
router.get('/dashboard', authMiddleware, userController.getUserDashboard);

// team directory (other users can see each other)
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);

// admin only (create, update others, delete)
router.post('/', requireAdmin, userController.createUser);
router.put('/:id', requireAdmin, userController.updateUser);
router.delete('/:id', requireAdmin, userController.deleteUser);
router.post('/:userId/reset-password', requireAdmin, userController.resetUserPassword);

module.exports = router;
