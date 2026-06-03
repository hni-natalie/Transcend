import { apiClient } from '@api/api.client';
import { API_CONFIG } from '@api/api.config';
import { Department } from '@/shared/types/department.types';

interface DeptResponse {
	success?: boolean;
	data?: Department;
	message?: string
}

export const officeService = {
	// get office departments
	getAllDept: async (): Promise<DeptResponse> => {
		const data = await apiClient.get(
			API_CONFIG.endpoints.departments.data
		);
		return data;
	},

	// get office departments
	getAllDeptNames: async (): Promise<DeptResponse> => {
		const data = await apiClient.get(
			API_CONFIG.endpoints.departments.names
		);
		return data;
	},
}