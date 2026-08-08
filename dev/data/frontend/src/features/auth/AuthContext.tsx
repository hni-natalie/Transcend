import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from './auth.service';
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
  const removeToken = () => localStorage.removeItem('token');

  // App bootstrap - restore auth from token
  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = getToken();
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authService.getMe();
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
    const response = await authService.googleLogin(idToken);
    const authUser = toAuthUser(response.user);
    setToken(response.token);
    setUser(authUser);
    return authUser;
  };

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const response = await authService.login(email, password);
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
        window.location.href = '/login';
    }
};

// local state only
//   const logout = () => {
//     removeToken();
//     setUser(null);
//     window.location.href = '/login';
//   };

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
