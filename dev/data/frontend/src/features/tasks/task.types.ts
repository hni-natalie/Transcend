export type Task = {
	taskId: string;
	taskTitle: string;
	taskPriority: 'low' | 'medium' | 'high';
	taskDesc?: string;
	taskStatus: 'not_started' | 'in_progress' | 'done';
	workSpaceId: string;
	dueDate?: string;
	createdAt: string;
	updatedAt: string;

	assignedTo: 
	{
		assignedId: string;
		userId: string;
		taskPriority: 'low' | 'medium' | 'high';
		assignedDate: string;
	}[];
}