import React from 'react';
import { MenuConfig } from '../types/menu.types';
import { IconDashboard, IconUsers, IconSpaces, IconActivity, IconSettings } from '../config/menu.icons.conf';
import { ROUTE_PATH as R } from './routes.manifest';

export const menuConfig: MenuConfig = [
{
	title: 'Dashboard',
	href: R.ADMIN_DASHBOARD,
	icon: <IconDashboard/>
},
{
	title: 'Users',
	href: R.ADMIN_USERS,
	icon: <IconUsers />
},
{
	title: 'Spaces',
	href: R.ADMIN_SPACES,
	icon: <IconSpaces />
},
{
	title: 'Activity',
	href: R.ADMIN_ACTIVITY,
	icon: <IconActivity />
},
{
	title: 'Settings',
	href: R.ADMIN_SETTINGS,
	icon: <IconSettings />
}

]