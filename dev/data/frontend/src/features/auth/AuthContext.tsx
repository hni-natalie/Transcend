import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from './auth.api';
import type { AuthUser } from './auth.types';
import { toAuthUser } from './auth.types';
import { UserBackendStatus } from '@shared';
import { apiClient } from '@api/api.client';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  googleLogin: (idToken: string) => Promise<AuthUser>; 
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateUserStatus: (status: UserBackendStatus) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // update user status on backend and update local state
  const updateUserStatus = async (status: UserBackendStatus) => {
    try {
      await apiClient.patch('/users/status', { status });
      
      setUser(prev => prev ? { ...prev, userStatus: status } : null);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getToken = () => localStorage.getItem('token');
  const setToken = (token: string) => localStorage.setItem('token', token);
  
  const removeToken = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('sessionId'); 
  };

  useEffect(() => {
	// Register global session expired handler for mid-session 401s
    apiClient.registerSessionExpiredHandler(() => {
      removeToken();
      setUser(null);
      const publicPaths = ['/login', '/', '/terms', '/privacy'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    });


    const bootstrapAuth = async () => {
      const token = getToken();
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authApi.getMe();
        setUser(toAuthUser(userData));
      } catch (error) {
        if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
          console.log('Session expired. Please login again.');
        }
        removeToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const googleLogin = async (idToken: string): Promise<AuthUser> => {
    const response = await authApi.googleLogin(idToken);
    const authUser = toAuthUser(response.user);
    setToken(response.token);
    setUser(authUser);
    return authUser;
  };

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const response = await authApi.login(email, password);
    const authUser = toAuthUser(response.user);
    setToken(response.token);
    setUser(authUser);
    return authUser; 
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      removeToken(); 
      setUser(null);
	  if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

    //   window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        googleLogin,
        login,
        logout,
        updateUserStatus, 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};