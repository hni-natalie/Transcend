import React from 'react';
import { ROUTE_PATH as R } from '@config/routes.manifest';
import { Landing, Login, Terms, Privacy,
		AdminDashboard, UserManagement, SpaceManagement, ActivityLog, AdminSettings,
		UserDashboard, Office, OfficeRoom, Tasks, Meetings, Messages, UserSettings 
		} from '@pages';

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  title: string;
  requiresAuth?: boolean;
  allowedRoles?: string[];
  isGuestOnly?: boolean;		// redirects to dashboard if logged in
}

export const routes: RouteConfig[] = [
	{
		// testing
		path: '/office',
		element: <Office roomName="Office" />,
		title: 'Office'
	},
	{
		// testing
		path: '/room',
		element: <OfficeRoom />,
		title: 'Spaces'
	},

	// Public
	{
		path: R.HOME,
		element: <Landing />,
		title: 'Home · WorkFrom,',
		isGuestOnly: true,
	},
	{
		path: R.LOGIN,
		element: <Login />,
		title: 'Login · WorkFrom,',
		isGuestOnly: true,
	},
	{
        path: R.TERMS,
        element: <Terms />,
        title: 'Terms & Conditions · WorkFrom,'
    },
    {
        path: R.PRIVACY,
        element: <Privacy />,
        title: 'Privacy Policy · WorkFrom,'
    },

	// Admin
	{
		path: R.ADMIN_DASHBOARD,
		element: <AdminDashboard />,
		title: 'Dashboard · Admin · WorkFrom,',
		requiresAuth: true,
		allowedRoles: ['Admin'],
	},
	{
		path: R.ADMIN_USERS,
		element: <UserManagement />,
		title: 'User Management · Admin · WorkFrom,',
		requiresAuth: true,
		allowedRoles: ['Admin'],
	},
	{
		path: R.ADMIN_SPACES,
		element: <SpaceManagement />,
		title: 'Spaces · Admin · WorkFrom,',
		requiresAuth: true,
		allowedRoles: ['Admin'],
	},
	{
		path: R.ADMIN_ACTIVITY,
		element: <ActivityLog />,
		title: 'Activity · Admin · WorkFrom,',
		requiresAuth: true,
		allowedRoles: ['Admin'],
	},
	{
		path: R.ADMIN_SETTINGS,
		element: <AdminSettings />,
		title: 'Settings · Admin · WorkFrom,',
		requiresAuth: true,
		allowedRoles: ['Admin'],
	},


	// User 
	{
		path: R.USER_DASHBOARD,
		element: <UserDashboard />,
		title: 'Dashboard · User · WorkFrom,',
		requiresAuth: true,
	},
	{
		path: R.USER_OFFICE,
		element: <Office roomName="Office" />,
		title: 'Virtual Office · User · WorkFrom,',
		requiresAuth: true,
	},
	{
		path: R.USER_TASKS,
		element: <Tasks />,
		title: 'Tasks · User · WorkFrom,',
		requiresAuth: true,
	},
	{
		path: R.USER_MEETINGS,
		element: <Meetings />,
		title: 'Meetings · User · WorkFrom,',
		requiresAuth: true,
	},
	{
		path: R.USER_MESSAGES,
		element: <Messages />,
		title: 'Messages · User · WorkFrom,',
		requiresAuth: true,
	},
	{
		path: R.USER_SETTINGS,
		element: <UserSettings />,
		title: 'Settings · User · WorkFrom,',
		requiresAuth: true,
	},
]
