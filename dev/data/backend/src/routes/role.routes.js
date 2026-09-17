const router = require('express').Router();
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');
const roleController = require('../controllers/role.controller');

router.use(authMiddleware);

router.get('/', roleController.getAllRoles);
router.get('/:roleId', roleController.getRoleById);

router.post('/', requireAdmin, roleController.createRole);
// router.put('/:roleId', requireAdmin, roleController.updateRole);
// router.delete('/:roleId', requireAdmin, roleController.deleteRole);

module.exports = router;