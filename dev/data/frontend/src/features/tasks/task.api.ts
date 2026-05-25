import { apiClient } from '@api/api.client';
import { API_CONFIG } from '@api/api.config';
import { Task } from './task.types';

const API_URL = API_CONFIG.endpoints.tasks;

export const taskApi = {
	getAllTasks: () => {
		return apiClient.get<Task[]>(API_URL);
	},

	getTaskById: (taskId: string) => {
		return apiClient.get<Task>(`${API_URL}/${taskId}`);
	},

	createTask: (data: {
		taskTitle: string;
		taskPriority: 'low' | 'medium' | 'high';
		taskDescription?: string;
		workspaceId: string;
	}) => {
		return apiClient.post<Task>(API_URL, data);
	},

	updateTask: (taskId: string, data: {
		taskTitle?: string;
		taskPriority?: 'low' | 'medium' | 'high';
		taskDescription?: string;
		workspaceId?: string;
	}) => {
		return apiClient.put<Task>(`${API_URL}/${taskId}`, data);
	},
	deleteTask: (taskId: string) => {
		return apiClient.delete(`${API_URL}/${taskId}`);
	}
}
