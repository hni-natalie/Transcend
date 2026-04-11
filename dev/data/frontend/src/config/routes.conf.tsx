import { Landing, Login, Dashboard, Spaces, SpacesMulti, RoomPage } from '../pages';
import { ROUTE_PATH as R } from './routes.manifest';

export const routes = [
{
	// testing
	path: '/office',
	element: <SpacesMulti roomName="Office" />,
	title: 'Office'
},
{
	// testing
	path: '/room',
	element: <RoomPage />,
	title: 'Spaces'
},
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
	title: 'Users'
},
{
	path: R.SPACES,
	element: <Spaces />,
	title: 'Spaces'
},
{
	path: R.ACTIVITY,
	title: 'Activity'
},
{
	path: R.SETTING,
	title: 'Settings'
},
]