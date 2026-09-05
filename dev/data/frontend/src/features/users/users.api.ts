import { apiClient } from '@api/api.client';
import { API_CONFIG } from '@api/api.config';
import { User, Role, Department } from '@shared';

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface CreateUserRequest {
    email: string;
    name: string;
    roleId: string;
    dpId?: string;
	userTitle?: string;
    password?: string;
}

export interface UpdateUserRequest {
    name?: string;
    email?: string;
	userTitle?: string;
    roleId?: string;
    dpId?: string;
    status?: string;
    password?: string;
	country?: string;
    city?: string;
}

interface CreateUserResponse {
    success: boolean;
    message: string;
    data: {
        userId: string;
        userEmail: string;
        userName: string;
        userStatus: string;
        createdAt: string;
        temporaryPassword?: string;
    };
}

export interface ChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
}

export interface UpdateCurrentUserProfileRequest { 
	city?: string;
	country?: string;
	timezone?: string;
	avatarUrl?: string; 
}


export const userApi = {
    fetchAllUsers: async (): Promise<User[]> => {
        return apiClient.get<User[]>(
            API_CONFIG.endpoints.users.base
        );
    },

    fetchUserById: async (userId: string): Promise<User> => {
        return apiClient.get<User>(
            `${API_CONFIG.endpoints.users.base}/${userId}`
        );
    },

    fetchRoles: async (): Promise<Role[]> => {
        const response = await apiClient.get<ApiResponse<Role[]>>(
            API_CONFIG.endpoints.roles
        );

        return response.data;
    },

    fetchDepartments: async (): Promise<Department[]> => {
        const response = await apiClient.get<ApiResponse<Department[]>>(
            API_CONFIG.endpoints.departments.data
        );

        return response.data;
    },

    createUser: async (
        userData: CreateUserRequest
    ): Promise<CreateUserResponse> => {
        return apiClient.post<CreateUserResponse>(
            API_CONFIG.endpoints.users.base,
            userData
        );
    },

    updateUser: async (
        userId: string,
        userData: UpdateUserRequest
    ): Promise<User> => {
        return apiClient.patch<User>(
            `${API_CONFIG.endpoints.users.base}/${userId}`,
            userData
        );
    },

    deleteUser: async (userId: string): Promise<void> => {
        await apiClient.delete<void>(
            `${API_CONFIG.endpoints.users.base}/${userId}`
        );
    },

    changePassword: async (
        passwordData: ChangePasswordRequest
    ): Promise<{ success: boolean; message: string }> => {
        return apiClient.post<{ success: boolean; message: string }>(
            API_CONFIG.endpoints.users.changePassword,
            passwordData
        );
    },

    updateCurrentUserProfile: async (
        profileData: UpdateCurrentUserProfileRequest
    ): Promise<User> => {
        return apiClient.patch<User>(
            API_CONFIG.endpoints.users.me,
            profileData
        );
    },

    getCurrentUser: async (): Promise<User> => {
    	return apiClient.get<User>(
			API_CONFIG.endpoints.users.me
		);
	},

    resetUserPassword: async (
        userId: string,
        newPassword: string
    ): Promise<{ success: boolean; message: string }> => {
        return apiClient.post<{ success: boolean; message: string }>(
            `${API_CONFIG.endpoints.users.resetPassword}/${userId}`,
            { newPassword }
        );
    },
};
