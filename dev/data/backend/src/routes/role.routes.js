const router = require('express').Router();
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');
const roleController = require('../controllers/role.controller');

// all routes require authentication (must be logged in)
router.use(authMiddleware);

// anyone can view roles (for dropdowns, displaying user roles)
router.get('/', roleController.getAllRoles);
router.get('/:roleId', roleController.getRoleById);

// admin only (create, update others, delete)
router.post('/', requireAdmin, roleController.createRole);
// router.put('/:roleId', requireAdmin, roleController.updateRole);
// router.delete('/:roleId', requireAdmin, roleController.deleteRole);

module.exports = router;