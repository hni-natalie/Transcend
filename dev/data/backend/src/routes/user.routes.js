const router = require('express').Router();
const multer = require('multer');
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller')

const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

router.get('/me', userController.getCurrentUser);
router.patch('/me', userController.updateCurrentUser);
router.get('/dashboard', userController.getUserDashboard);
router.patch('/status', userController.updateUserStatus);
router.get('/status/:status', userController.getUsersByStatus);
router.get('/password-rules', userController.getPasswordRules);
router.post('/change-password', userController.changePassword);
router.post('/avatar', upload.single('avatar'), userController.uploadAvatar);
router.get('/me/data-export', userController.getMyDataExport);
router.post('/me/deletion-request', userController.requestAccountDeletion);

router.get('/', userController.getAllUsers);
router.get('/dashboard/metrics', requireAdmin, userController.getDashboardMetrics);
router.get('/:id', userController.getUserById);

router.post('/', requireAdmin, userController.createUser);
router.patch('/:id', requireAdmin, userController.updateUser);
router.delete('/:id', requireAdmin, userController.deleteUser);
router.post('/avatar/:id', requireAdmin, upload.single('avatar'), userController.uploadAvatarForUser);
router.post('/:userId/reset-password', requireAdmin, userController.resetUserPassword);

module.exports = router;
