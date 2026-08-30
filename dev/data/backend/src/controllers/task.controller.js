const taskService = require('../services/task.service');
const { getIO } = require("../services/socket.service");
const {
    validateCreateTask,
	validateUpdateTask
} = require('../validators/task.validator');


const taskController = {

	async getAllTasks(req, res) {
		try {
			const { userId } = req.user;
			const tasks = await taskService.getAllTasks({ userId });
			return res.json(tasks);
		} catch (error) {
			console.error('Error fetching tasks:', error);
			res.status(500).json({ error: 'Failed to fetch tasks' });
		}
	},

	async getTaskById(req, res) {
		try {
			const { id } = req.params;
			if (!id) {
				return res.status(400).json({error: "Task ID required"});
			}
			const task = await taskService.getTaskById(id);
			return res.json(task);

		} catch (error) {
			if (error.message === 'Task not found') {
				res.status(404).json({ error: error.message });
			} else {
				res.status(500).json({ error: error.message });
			}
		}
	},

	async createTask(req, res) {
		try {
			let validated;
			try {
				validated = validateCreateTask(req.body);
			} catch (validationErr) {
				return res.status(400).json({ success: false, message: validationErr.message });
			}
			
			const { taskTitle, taskPriority, taskDesc, dueDate, assignedUserIds } = validated;
			
			const workspaceId = req.user.workspaceId;
			const createdByUserId = req.user.userId;

			if (!workspaceId || !createdByUserId) {
				return res.status(400).json({ success: false, message: 'Workspace ID and User ID are required' });
			}

			// Create the task using the service

			const newTask = await taskService.createTask({
				taskTitle,
				taskDesc,
				dueDate,
				taskPriority,
				workspaceId,
				createdByUserId,
				assignedUserIds,
			});
			getIO().emit("taskUpdated");
			return res.status(201).json(newTask);

		} catch (error) {
			console.error('Error creating task:', error);
			res.status(500).json({ error: 'Failed to create task' });
		}
	},
	
	async updateTask(req, res) {
		try {
			const { id } = req.params;
			const userId = req.user.userId;
			
			let validated;
			try {
				validated = validateUpdateTask(req.body);
			} catch (validationErr) {
				return res.status(400).json({ success: false, message: validationErr.message });
			}

			// const updatedTask = await taskService.updateTask(id, userId, req.body);
			const updatedTask = await taskService.updateTaskWithLogging(id, userId, validated);
			getIO().emit("taskUpdated");
			return res.json(updatedTask);

		} catch (error) {
			if (error.message === 'Task not found') {
				res.status(404).json({ error: error.message });
			} else {
				console.error('Error updating task:', error);
				res.status(500).json({ error: 'Failed to update task' });
			}
		}
	},

	async deleteTask(req, res) {
		try {
			const { id } = req.params;
			const userId = req.user.userId;
			
			await taskService.deleteTask(id, userId);
			getIO().emit("taskUpdated");
			return res.json({ message: 'Task deleted successfully' });
		} catch (error) {
			if (error.message === 'Task not found') {
				res.status(404).json({ error: error.message });
			} else {
				console.error('Error deleting task:', error);
				res.status(500).json({ error: 'Failed to delete task' });
			}
		}
	}
};

module.exports = taskController; 