import React from 'react';
import { Landing, Login, AdminDashboard, AdminUserManagement, Office, Room } from '@pages';
import { ROUTE_PATH as R } from '@config/routes.manifest';

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
		element: <Room />,
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

	// Admin
	{
		path: R.ADMIN_DASHBOARD,
		element: <AdminDashboard />,
		title: 'Dashboard · Admin · WorkFrom,'
	},
	{
		path: R.ADMIN_USERS,
		element: <AdminUserManagement />,
		title: 'User Management · Admin · WorkFrom,'
	},
	{
		path: R.ADMIN_SPACES,
		element: <Office roomName="Admin Office" />,
		title: 'Spaces · Admin · WorkFrom,'
	},
	{
		path: R.ADMIN_ACTIVITY,
		element: <div />,
		title: 'Activity · Admin · WorkFrom,'
	},
	{
		path: R.ADMIN_SETTINGS,
		element: <div />,
		title: 'Settings · Admin · WorkFrom,'
	},


	// User 
	{
		path: R.USER_DASHBOARD,
		element: <div />,
		title: 'Dashboard · User · WorkFrom,'
	},
	{
		path: R.USER_OFFICE,
		element: <div />,
		title: 'Virtual Office · User · WorkFrom,'
	},
	{
		path: R.USER_TASKS,
		element: <div />,
		title: 'Tasks · User · WorkFrom,'
	},
	{
		path: R.USER_MEETINGS,
		element: <div />,
		title: 'Meetings · User · WorkFrom,'
	},
	{
		path: R.USER_MESSAGES,
		element: <div />,
		title: 'Messages · User · WorkFrom,'
	},
	{
		path: R.USER_SETTINGS,
		element: <div />,
		title: 'Settings · User · WorkFrom,'
	},
]