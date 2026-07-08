const router = require('express').Router();
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller')

// all routes require authentication (must be logged in)
router.use(authMiddleware);

// self-service (any authenticated user can do these to themselves)
router.get('/password-rules', userController.getPasswordRules);
router.post('/change-password', userController.changePassword);
router.get('/me', userController.getCurrentUser);                   // view own profile
router.put('/me', userController.updateCurrentUser);                // edit own profile
// router.put('/me/avatar', userController.updateAvatar);              // upload avatar
router.patch('/status', authMiddleware, userController.updateUserStatus);

// admin dashboard specific aggregates (Add this here!)
router.get('/dashboard/metrics', requireAdmin, userController.getDashboardMetrics)
router.get('/dashboard', authMiddleware, userController.getUserDashboard);

// team directory (other users can see each other)
router.get('/', userController.getAllUsers);                        // list users (for team directory)
router.get('/:id', userController.getUserById);                     // view any user profile

// admin only (create, update others, delete)
router.post('/', requireAdmin, userController.createUser);
router.put('/:id', requireAdmin, userController.updateUser);
router.delete('/:id', requireAdmin, userController.deleteUser);
router.post('/:userId/reset-password', requireAdmin, userController.resetUserPassword);

module.exports = router;
