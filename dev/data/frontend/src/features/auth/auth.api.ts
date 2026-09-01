import { apiClient } from '@api/api.client';
import { API_CONFIG } from '@api/api.config';
import type { User } from '@shared';
import type { LoginResponse } from './auth.types';

export const authApi = {
  // Email login
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const data = await apiClient.post<LoginResponse>(
      API_CONFIG.endpoints.auth.login,
      { userEmail: email, userPassword: password }
    );
    return data;
  },

   // Google login with token
  googleLogin: async (idToken: string): Promise<LoginResponse> => {
    const data = await apiClient.post<LoginResponse>(
      API_CONFIG.endpoints.auth.google,
      { idToken }
    );
    return data;
  },
  
  // Get current user
  getMe: async (): Promise<User> => {
    return apiClient.get<User>(API_CONFIG.endpoints.auth.me);
  },
};