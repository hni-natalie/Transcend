export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  endpoints: {
    auth: {
      login: '/auth/login',     
      me: '/auth/me',
      google: '/auth/google',
      logout: '/auth/logout',
    },
    lk: '/lk',
    player: '/player',
    roles: '/roles',
    users: {
      base: '/users',
	  me: '/users/me',
      dashboardMetrics: '/users/dashboard/metrics',
	  userDashboard: '/users/dashboard', 
	  changePassword: '/users/change-password', 
	  resetPassword: '/users/reset-password',
    },
    departments: {
      data: '/departments',
      names: '/departments/dpName',
    },
    spaces: {
      data: '/spaces',
      names: '/spaces/spaceName',
    },
    tasks: '/tasks',
    meetings: '/meetings',
    recordings: '/recordings', 
	messages: '/messages', 
	activity: '/activity',
    init: '/init',

  }
} as const;