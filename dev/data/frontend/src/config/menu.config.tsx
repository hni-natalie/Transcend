import React from 'react';
import { MenuConfig } from '@shared/types/menu.types';
import { IconDashboard, IconUsers, IconSpaces, IconActivity, IconSettings } from '@shared/ui/Icons';
import { ROUTE_PATH as R } from '@config/routes.manifest';

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