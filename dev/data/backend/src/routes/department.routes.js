const router = require('express').Router();
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');
const departmentController = require('../controllers/department.controller');

router.use(authMiddleware);

router.get('/', departmentController.getAllDepartments);
router.get('/dpName', departmentController.getAllDepartmentNames);
router.get('/:dpId', departmentController.getDepartmentById);

// admin only (create, update others, delete)
router.post('/', requireAdmin, departmentController.createDepartment);
// router.put('/:dpId', requireAdmin, departmentController.updateDepartment);
// router.delete('/:dpId', requireAdmin, departmentController.deleteDepartment);

module.exports = router;