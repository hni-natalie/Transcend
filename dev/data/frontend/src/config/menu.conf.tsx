import React from 'react';
import { MenuConfig } from '../types/menu.types';
import { IconDashboard, IconUsers, IconSpaces, IconActivity, IconSettings } from '../config/menu.icons.conf';
import { ROUTE_PATH as R } from './routes.manifest';

export const menuConfig: MenuConfig = [
{
	title: 'Dashboard',
	href: R.DASHBOARD,
	icon: <IconDashboard/>
},
{
	title: 'Users',
	href: R.USERS,
	icon: <IconUsers />
},
{
	title: 'Spaces',
	href: R.SPACES,
	icon: <IconSpaces />
},
{
	title: 'Activity',
	href: R.ACTIVITY,
	icon: <IconActivity />
},
{
	title: 'Settings',
	href: R.SETTING,
	icon: <IconSettings />
}

]