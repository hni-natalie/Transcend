import type { User } from '@/shared/types/user.types';

export interface LoginRequest {
  userEmail: string;
  userPassword: string;
}

export interface AuthUser {
  socketId: string,
  userId: string;
  userName: string;
  userEmail: string;
  roleId: string;
  roleName: string;
  userStatus: string;
  avatarUrl: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// helper to convert backend user to authUser
export const toAuthUser = (user: User): AuthUser => ({
  userId: user.userId,
  userName: user.userName,
  userEmail: user.userEmail,
  roleId: user.roleId ?? user.role?.roleId ?? '',
  socketId: user.socketId,
  roleName: user.roleName ?? user.role?.roleName ?? '',
  userStatus: user.userStatus,
  avatarUrl: user.avatarUrl ?? null,
});