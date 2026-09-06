const router = require('express').Router();
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');
const spaceController = require('../controllers/space.controller'); 

router.use(authMiddleware);

router.get('/', spaceController.getAllSpaces);
router.get('/spaceName', spaceController.getAllSpaceNames);
router.get('/:spaceId', spaceController.getSpaceById);

router.post('/', requireAdmin, spaceController.createSpace);
router.put('/', requireAdmin, spaceController.updateSpace);
router.delete('/:spaceId', requireAdmin, spaceController.deleteSpace);

module.exports = router;