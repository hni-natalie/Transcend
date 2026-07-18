import { apiClient } from '@api/api.client';
import { API_CONFIG } from '@api/api.config';
import { Space } from '@/shared/types/space.types';

interface SpaceResponse {
	success?: boolean;
	data?: Space;
	message?: string
}

export const officeService = {
	// get office departments
	getAllSpaces: async (): Promise<SpaceResponse> => {
		const data = await apiClient.get(
			API_CONFIG.endpoints.spaces.data
		);
		return data;
	},

	// get office departments
	getAllSpaceNames: async (): Promise<SpaceResponse> => {
		const data = await apiClient.get(
			API_CONFIG.endpoints.spaces.names
		);
		return data;
	},
}