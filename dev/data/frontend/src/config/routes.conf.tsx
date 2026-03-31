import React from 'react';
import { Landing, Login, Dashboard, Spaces } from '../pages';
import Users from '../pages/admin/Users';
import { ROUTE_PATH as R } from './routes.manifest';

export const routes = [
{
	path: "/",
	element: <Landing />,
	title: 'WorkFrom,'
},
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
{
	path: R.DASHBOARD,
	element: <Dashboard />,
	title: 'Dashboard'
},
{
	path: R.USERS,
	element: <Users />,
	title: 'Users'
},
{
	path: R.SPACES,
	element: <Spaces />,
	title: 'Spaces'
},
{
	path: R.ACTIVITY,
	element: <div />,
	title: 'Activity'
},
{
	path: R.SETTING,
	element: <div />,
	title: 'Settings'
},
]