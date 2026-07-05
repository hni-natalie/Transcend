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
	getAllSpace: async (): Promise<DeptResponse> => {
		const data = await apiClient.get(
			API_CONFIG.endpoints.spaces.data
		);
		return data;
	},

	// get office departments
	getAllSpaceNames: async (): Promise<DeptResponse> => {
		const data = await apiClient.get(
			API_CONFIG.endpoints.spaces.names
		);
		return data;
	},
}