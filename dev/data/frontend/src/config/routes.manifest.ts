// config/routes.manifest.ts - Single source of truth

export const ROUTE_PATH = {
  HOME: '/home',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  USERS: '/users',
  SPACES: '/spaces',
  ACTIVITY: '/activity',
  SETTING: '/setting',
} as const;

// For type safety
export type RoutePath = typeof ROUTE_PATH[keyof typeof ROUTE_PATH];