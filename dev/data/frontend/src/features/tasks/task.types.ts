export type Task = {
	id: string;
	taskTitle: string;
	taskPriority: 'low' | 'medium' | 'high';
	taskDesc?: string;
	taskStatus: 'not_started' | 'in_progress' | 'done';
	workspaceId: string;
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