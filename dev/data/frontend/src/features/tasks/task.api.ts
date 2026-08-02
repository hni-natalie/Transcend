import { apiClient } from '@api/api.client';
import { API_CONFIG } from '@api/api.config';
import { Task } from './task.types';

const API_URL = API_CONFIG.endpoints.tasks;
const usersBase = API_CONFIG.endpoints.users.base;

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
		taskDesc?: string;
		dueDate?: string;
		assignedUserIds?: string[];
	}) => {
		return apiClient.post<Task>(API_URL, data);
	},

	updateTask: (taskId: string, data: {
		taskTitle?: string;
		taskPriority?: 'low' | 'medium' | 'high';
		taskDesc?: string;
		taskStatus?: 'not_started' | 'in_progress' | 'done';
		dueDate?: string;
	}) => {
		return apiClient.put<Task>(`${API_URL}/${taskId}`, data);
	},
	deleteTask: (taskId: string) => {
		return apiClient.delete(`${API_URL}/${taskId}`);
	},
	allUsers: () => {
			return apiClient.get(`${usersBase}`);
		}
}
