// config/routes.manifest.ts - Single source of truth

export const ROUTE_PATH = {
	HOME: '/',
	LOGIN: '/login',

	// Admin routes
	ADMIN_DASHBOARD: '/admin/dashboard',
	ADMIN_USERS: '/admin/users',
	ADMIN_SPACES: '/admin/spaces',
	ADMIN_ACTIVITY: '/admin/activity',
	ADMIN_SETTINGS: '/admin/settings',

	// User routes
	// USER_DASHBOARD: '/user/dashboard',
	// USER_OFFICE: '/user/office',
	// USER_CHATS: '/user/chats',
	// USER_TASKS: '/user/tasks',
	// USER_CALENDAR: '/user/calendar',
	// USER_SETTINGS: '/user/settings',
	} as const;

export type RoutePath = typeof ROUTE_PATH[keyof typeof ROUTE_PATH];
