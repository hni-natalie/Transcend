import { apiClient } from '@api/api.client';
import { API_CONFIG } from '@api/api.config';
import { User, Role, Department } from '@shared';

/* **************************************************************
*  TYPES
*  **************************************************************/

// dto : data transfer object (pass data from be to fe, req format)
// user creates form > fe createuserdto > be controller/service receives dto > save to db

export interface CreateUserDto {
    email: string;
    name: string;
    roleId: string;
    workspaceId: string;
    dpId?: string;
    password?: string;
}

export interface UpdateUserDto {
    name?: string;
    email?: string;
    roleId?: string;
    dpId?: string;
    status?: string;
    password?: string;
	country?: string;
    city?: string;
}

export interface CreateUserResponse {
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

export interface ChangePasswordDto {
    oldPassword: string;
    newPassword: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface ResetPasswordDto {
    newPassword: string;
}

/* **************************************************************
*  API SERVICE FUNCTIONS
*  **************************************************************/

export async function fetchAllUsers(): Promise<User[]> {
    return apiClient.get<User[]>(API_CONFIG.endpoints.users.base);
}

export async function fetchUserById(userId: string): Promise<User> {
    return apiClient.get<User>(`${API_CONFIG.endpoints.users.base}/${userId}`);
}

export async function fetchRoles(): Promise<Role[]> {
    const response = await apiClient.get<ApiResponse<Role[]>>(API_CONFIG.endpoints.roles);
    return response.data;
}

export async function fetchDepartments(): Promise<Department[]> {
    const response = await apiClient.get<ApiResponse<Department[]>>(API_CONFIG.endpoints.departments);
    return response.data;
}

export async function createUser(userData: CreateUserDto): Promise<CreateUserResponse> {
    return apiClient.post<CreateUserResponse>(API_CONFIG.endpoints.users.base, userData);
}

export async function updateUser(userId: string, userData: UpdateUserDto): Promise<User> {
    return apiClient.put<User>(`${API_CONFIG.endpoints.users.base}/${userId}`, userData);
}

export async function deleteUser(userId: string): Promise<void> {
    await apiClient.delete<void>(`${API_CONFIG.endpoints.users.base}/${userId}`);
}

export async function changePassword(passwordData: ChangePasswordDto): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/users/change-password', passwordData);
}

export async function updateCurrentUserProfile(profileData: {
    city?: string;
    country?: string;
    timezone?: string;
    avatarUrl?: string;
}): Promise<User> {
    return apiClient.put<User>('/users/profile', profileData);
}

export async function getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/users/me');
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  return apiClient.post<{ success: boolean; message: string }>(
    `${API_CONFIG.endpoints.users.base}/${userId}/reset-password`,
    { newPassword }
  );
}
