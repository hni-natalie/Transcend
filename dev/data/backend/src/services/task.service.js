const prisma = require('../../prisma/client');
const taskController = require('../controllers/task.controller');

const taskService = {
	async getAllTasks(filters = {}) {
		const { userId } = filters;

		const where = {};
		if (userId) where.userId = userId;

		return await prisma.task.findMany({
			where,
			select:{
				taskId: true,
				taskTitle: true,
				taskDescription: true,
				taskStatus: true,
				taskPriority: true,
				createdAt: true,
				updatedAt: true,
			},

			orderBy: [
				{ createdAt: 'desc' },
				{ taskPriority: 'asc' }
			]
		});
	},

	async getTaskById(taskId) {
		const task = await prisma.task.findUnique({
			where: { taskId },
			select: {
				taskId: true,
				taskTitle: true,
				taskDescription: true,
				taskStatus: true,
				taskPriority: true,
				createdAt: true,
				updatedAt: true,
			}
		})
	},

	async createTask(taskData) {
		const { taskTitle, taskPriority, workSpaceId, userId } = taskData;

		return await prisma.task.create({
			data: {
				taskTitle,
				taskStatus : "not started",
				workSpaceId,
				createbyUserId: userId,

				assignedTo: {
					create: {
						userId,
						taskPriority
					}
				}
			}
		});
	},

	async updateTask(taskId, userId, updateData) {
		const { taskTitle, taskDesc, taskStatus, dueDate, taskPriority } = updateData;

		const task = await prisma.task.findUnique({ where: { taskId } });
		if (!task) throw new Error('Task not found');
		if (task.createdByUserId !== userId) throw new Error('Unauthorized to update this task');

		await prisma.task.update({
			where: { taskId },
			data: {
				taskTitle,
				taskDescription: taskDesc,
				taskStatus,
				dueDate,
			}
		});

		// update task priority in task assignment table
		await prisma.taskAssignment.updateMany({
			where: { taskId, userId },
			data: { taskPriority }
		});

		return prisma.task.findUnique({
			where: { taskId },
			include: { assignedTo: true }
		});
	},

	async deleteTask(taskId, userId) {
		const task = await prisma.task.findUnique({ where: { taskId } });
		if (!task) throw new Error('Task not found');
		if (task.createdByUserId !== userId) throw new Error('Unauthorized to delete this task');

		await prisma.task.delete({ where: { taskId } });
	}
}

