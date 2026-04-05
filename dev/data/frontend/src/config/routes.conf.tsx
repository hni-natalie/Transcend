import React from 'react';
import { Landing, Login, Dashboard, Spaces } from '../pages';
import Users from '../pages/admin/Users';
import { ROUTE_PATH as R } from './routes.manifest';

export const routes = [
  	// Main
	{
		path: R.HOME,
		element: <Landing />,
		title: 'WorkFrom,'
	},
	{
		path: R.LOGIN,
		element: <Login />,
		title: 'Login'
	},

	// Admin
	{
		path: R.ADMIN_DASHBOARD,
		element: <Dashboard />,
		title: 'Dashboard'
	},
	{
		path: R.ADMIN_USERS,
		element: <Users />,
		title: 'Users'
	},
	{
		path: R.ADMIN_SPACES,
		element: <Spaces />,
		title: 'Spaces'
	},
	{
		path: R.ADMIN_ACTIVITY,
		element: <div />,
		title: 'Activity'
	},
	{
		path: R.ADMIN_SETTINGS,
		element: <div />,
		title: 'Settings'
	},


	// User 
	// {
	// 	path: R.USER_DASHBOARD,
	// 	element: <div>User Dashboard</div>,
	// 	title: 'Dashboard'
	// },
	// {
	// 	path: R.USER_OFFICE,
	// 	element: <div>Virtual Office</div>,
	// 	title: 'Virtual Office'
	// },
	// {
	// 	path: R.USER_CHATS,
	// 	element: <div>Chats</div>,
	// 	title: 'Chats'
	// },
	// {
	// 	path: R.USER_TASKS,
	// 	element: <div>Tasks</div>,
	// 	title: 'Tasks'
	// },
	// {
	// 	path: R.USER_SETTINGS,
	// 	element: <div>Settings</div>,
	// 	title: 'Settings'
	// },
	]