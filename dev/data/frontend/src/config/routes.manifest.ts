export const ROUTE_PATH = {
	// public
	HOME: '/',
	LOGIN: '/login',
	TERMS: '/terms',
	PRIVACY: '/privacy',

	// admin
	ADMIN_DASHBOARD: '/admin/dashboard',
	ADMIN_USERS: '/admin/users',
	// ADMIN_SPACES: '/admin/spaces',
	ADMIN_ACTIVITY: '/admin/activity',
	// ADMIN_SETTINGS: '/admin/settings', // kiv - to remove

	// user
	USER_DASHBOARD: '/user/dashboard',
	USER_OFFICE: '/user/office',
	USER_TASKS: '/user/tasks',
	USER_MEETINGS: '/user/meetings',
	USER_VIDEOCALL: '/user/meetings/vid',
	USER_MESSAGES: '/user/messages',
	USER_SETTINGS: '/user/settings',
	} as const;

export type RoutePath = typeof ROUTE_PATH[keyof typeof ROUTE_PATH];
