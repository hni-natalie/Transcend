import { PageHeader, IconDashboard } from '@shared';
// import features

export const UserDashboard = () => {
  return (
	<>
	  <PageHeader 
		icon={<IconDashboard className="w-7 h-7" />}
		title="Dashboard"
	  />
	  <div className="flex items-center justify-center h-full">
		<p className="text-content-2">User Dashboard coming soon...</p>
	  </div>
	</>
  );
};