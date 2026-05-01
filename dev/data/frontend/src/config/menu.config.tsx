import React from 'react';
import { ROUTE_PATH as R } from '@config/routes.manifest';
import { MenuConfig } from '@shared/types/menu.types';
import {
  IconDashboard, IconSettings, IconOffice, IconMessages,
  IconUsers, IconSpaces, IconActivity, 
  IconTasks, IconMeetings
} from '@shared/ui/Icons';

export const adminMenuConfig: MenuConfig = [
  {
    title: 'Dashboard',
    href: R.ADMIN_DASHBOARD,
    icon: <IconDashboard />,
  },
  {
    title: 'Users',
    href: R.ADMIN_USERS,
    icon: <IconUsers />,
  },
  {
    title: 'Spaces',
    href: R.ADMIN_SPACES,
    icon: <IconSpaces />,
  },
  {
    title: 'Activity',
    href: R.ADMIN_ACTIVITY,
    icon: <IconActivity />,
  },
  {
    title: 'Settings',
    href: R.ADMIN_SETTINGS,
    icon: <IconSettings />,
  },
];

export const userMenuConfig: MenuConfig = [
  {
    title: 'Dashboard',
    href: R.USER_DASHBOARD,
    icon: <IconDashboard />,
  },
  {
    title: 'Office',
    href: R.USER_OFFICE,
    icon: <IconOffice />,
  },
  {
    title: 'Tasks',
    href: R.USER_TASKS,
    icon: <IconTasks />,
  },
  {
    title: 'Meetings',
    href: R.USER_MEETINGS,
    icon: <IconMeetings />,
  },
  {
    title: 'Messages',
    href: R.USER_MESSAGES,
    icon: <IconMessages />,
  },
  {
    title: 'Settings',
    href: R.USER_SETTINGS,
    icon: <IconSettings />,
  },
];

export const menuConfig = adminMenuConfig;
