const router = require('express').Router();
const { authMiddleware, requireAdmin } = require('../middleware/auth.middleware');
const taskController = require('../controllers/task.controller');

// all routes require authentication (must be logged in)
router.use(authMiddleware);

router.get("/", taskController.getAllTasks);
router.get("/:id", taskController.getTaskById);
router.post("/", taskController.createTask);
router.put("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

module.exports = router;