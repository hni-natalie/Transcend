const prisma = require('../../prisma/client');
const { logTaskActivity } = require('../utils/activity'); 

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
								deletedAt: true,
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

		const newTask = await prisma.task.create({
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
					deletedAt: true,
					},
				},
				},
			},
			},
		});

		await logTaskActivity({
			workspaceId,
			userId: createdByUserId,
			action: 'created a task',
			contextTitle: newTask.taskTitle,
			priority: taskPriority,
		});

		return newTask;
	},

	async updateTask(taskId, userId, updateData) {
		const { taskTitle, taskDesc, taskStatus, dueDate, taskPriority } = updateData;
		const task = await prisma.task.findUnique({ where: { taskId } });

		if (!task) throw new Error('Task not found');
		
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

	async updateTaskWithLogging(taskId, userId, updateData) {
		const before = await prisma.task.findUnique({ where: { taskId } });

		const result = await taskService.updateTask(taskId, userId, updateData);

		const isCompleting = updateData.taskStatus === 'done' && before?.taskStatus !== 'done';
		await logTaskActivity({
			workspaceId: before.workspaceId,
			userId,
			action: isCompleting ? 'completed a task' : 'updated a task',
			contextTitle: result.taskTitle,
		});

		return result;
	},

	async deleteTask(taskId, userId) {
		const task = await prisma.task.findUnique({ where: { taskId } });
		if (!task) throw new Error('Task not found');
		if (task.createdByUserId !== userId) throw new Error('Unauthorized to delete this task');

		await prisma.task.delete({ where: { taskId } });

		await logTaskActivity({
			workspaceId: task.workspaceId,
			userId,
			action: 'deleted a task',
			contextTitle: task.taskTitle,
		});
	}
}

module.exports = taskService;