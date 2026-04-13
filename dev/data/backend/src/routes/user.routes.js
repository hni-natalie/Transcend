const express = require('express')
const router = express.Router()
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller')

// protected route - need login to see own profile
router.get('/me', authMiddleware, userController.getUserById);

// admin only routes
// use : all /admin route requires auth + admin role
router.use('/admin', authMiddleware, requireAdmin);
router.get('/admin/users', userController.getAllUsers);
router.get('/admin/users/:id', userController.getUserById);
router.post('/admin/users', userController.createUser);
router.put('/admin/users/:id', userController.updateUser);
router.delete('/admin/users/:id', userController.deleteUser);

module.exports = router;
