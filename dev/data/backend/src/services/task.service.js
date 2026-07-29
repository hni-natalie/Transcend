const prisma = require('../../prisma/client');
const taskController = require('../controllers/task.controller');

const taskService = {
	async getAllTasks(filters = {}) {
		const { userId } = filters;

		// list tasks where  task is created by user or assigned to user
		const where = userId ? {
			OR: [
				{ createdByUserId: userId },
				{ assignedTo: { some: { userId: userId } } }
			]
		} : {};

		return await prisma.task.findMany({
			where,
			select:{
				taskId: true,
				taskTitle: true,
				taskDesc: true,
				dueDate: true,
				taskStatus: true,
				createdAt: true,
				updatedAt: true,
				completedDate: true,
				assignedTo: {
					select: {
						userId: true,
						taskPriority: true,
						user: {
							select: {
								userId: true,
								userName: true,
								userEmail: true,
								avatarUrl: true,
								role: {
									select :{
										roleId: true,
										roleName: true
									}
								}
							}
						}
					}
				}
			},

			orderBy: [
				{ createdAt: 'desc' }
			]
		});
	},

	async getTaskById(taskId) {
		return await prisma.task.findUnique({
			where: { taskId: taskId },
			select: {
				taskId: true,
				taskTitle: true,
				taskDesc: true,
				taskStatus: true,
				dueDate: true,
				createdAt: true,
				assignedTo: {
					select: { taskPriority: true }
				}
			}
		});
	},

	async createTask(taskData) {
		const {taskTitle, taskPriority, workspaceId, createdByUserId, taskDesc, dueDate, assignedUserIds = [], } = taskData;
		const uniqueAssignedUserIds = [...new Set(assignedUserIds)];

		return await prisma.task.create({
			data: {
			taskTitle,
			taskDesc: taskDesc || null,
			dueDate,
			taskStatus: "not_started",
			completedDate: null,

			workspace: {
				connect: { workspaceId },
			},

			createdBy: {
				connect: { userId: createdByUserId },
			},

			assignedTo: {
				create: uniqueAssignedUserIds.map((userId) => ({
				user: {
					connect: { userId },
				},
				taskPriority,
				})),
			},
			},

			include: {
			assignedTo: {
				include: {
				user: {
					select: {
					userId: true,
					userName: true,
					userEmail: true,
					},
				},
				},
			},
			},
		});
	},

	async updateTask(taskId, userId, updateData) {
		const { taskTitle, taskDesc, taskStatus, dueDate, taskPriority } = updateData;
		const task = await prisma.task.findUnique({ where: { taskId } });

		if (!task) throw new Error('Task not found');
		if (task.createdByUserId !== userId) throw new Error('Unauthorized to update this task');
		if (taskStatus == 'done')
			updateData.completedDate = new Date();

		await prisma.task.update({
			where: { taskId },
			data: {
				taskTitle,
				taskDesc: taskDesc,
				taskStatus,
				dueDate,
				completedDate: updateData.completedDate
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

module.exports = taskService;