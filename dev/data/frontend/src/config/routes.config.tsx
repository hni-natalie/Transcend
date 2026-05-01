import React from 'react';
import { ROUTE_PATH as R } from '@config/routes.manifest';
import { Landing, Login, Terms, Privacy,
		AdminDashboard, UserManagement, SpaceManagement, ActivityLog, AdminSettings,
		UserDashboard, Office, OfficeRoom, Tasks, Meetings, Messages, UserSettings 
		} from '@pages';

export const routes = [
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
		title: 'Home · WorkFrom,'
	},
	{
		path: R.LOGIN,
		element: <Login />,
		title: 'Login · WorkFrom,'
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
		title: 'Dashboard · Admin · WorkFrom,'
	},
	{
		path: R.ADMIN_USERS,
		element: <UserManagement />,
		title: 'User Management · Admin · WorkFrom,'
	},
	{
		path: R.ADMIN_SPACES,
		element: <SpaceManagement />,
		title: 'Spaces · Admin · WorkFrom,'
	},
	{
		path: R.ADMIN_ACTIVITY,
		element: <ActivityLog />,
		title: 'Activity · Admin · WorkFrom,'
	},
	{
		path: R.ADMIN_SETTINGS,
		element: <AdminSettings />,
		title: 'Settings · Admin · WorkFrom,'
	},


	// User 
	{
		path: R.USER_DASHBOARD,
		element: <UserDashboard />,
		title: 'Dashboard · User · WorkFrom,'
	},
	{
		path: R.USER_OFFICE,
		element: <Office roomName="Office" />,
		title: 'Virtual Office · User · WorkFrom,'
	},
	{
		path: R.USER_TASKS,
		element: <Tasks />,
		title: 'Tasks · User · WorkFrom,'
	},
	{
		path: R.USER_MEETINGS,
		element: <Meetings />,
		title: 'Meetings · User · WorkFrom,'
	},
	{
		path: R.USER_MESSAGES,
		element: <Messages />,
		title: 'Messages · User · WorkFrom,'
	},
	{
		path: R.USER_SETTINGS,
		element: <UserSettings />,
		title: 'Settings · User · WorkFrom,'
	},
]
