const taskService = require('../services/task.service');

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
			
			const { taskTitle, taskPriority, taskDesc, dueDate, assignedUserIds } = req.body;
			
			if (!taskTitle || !taskPriority) {
				return res.status(400).json({ error: 'taskTitle and taskPriority are required' });
			}

			const workspaceId = req.user.workspaceId;
			const createdByUserId = req.user.userId;

			const newTask = await taskService.createTask({
				taskTitle,
				taskDesc,
				dueDate,
				taskPriority,
				workspaceId,
				createdByUserId,
				assignedUserIds,
			});
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

			const updatedTask = await taskService.updateTask(id, userId, req.body);

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