// api.config.ts   — WHERE to send requests (URLs, baseURL, timeout)
// api.client.ts   — HOW to send requests (auth, errors, interceptors)
// api.types.ts    — WHAT the requests/responses look like (shapes) - no need for now

// note: no /api prefix (baseURL has it)
// use relative URL - dev server proxies to backend
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
      dashboardMetrics: '/users/dashboard/metrics',
	  userDashboard: '/users/dashboard', 
    },
    uploads: '/uploads',
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
	// messages: '/conversations', 
	activity: '/activity',
    init: '/init',

  }
} as const;