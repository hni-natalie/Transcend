// src/features/auth/auth.types.ts
import type { User } from '@/shared/types/user.types';

export interface LoginRequest {
  userEmail: string;
  userPassword: string;
}

export interface AuthUser {
  userId: string;
  userName: string;
  userEmail: string;
  roleId: string;
  roleName: string;
  userStatus: string;
  avatarUrl: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// helper to convert backend user to authUser
export const toAuthUser = (user: User): AuthUser => ({
  userId: user.userId,
  userName: user.userName,
  userEmail: user.userEmail,
  roleId: user.roleId,
  roleName: user.roleName,
  userStatus: user.userStatus,
  avatarUrl: user.avatarUrl ?? null,
});