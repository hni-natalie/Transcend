import { PageHeader, IconDashboard } from '@shared';
import { Dashboard } from '@/features/users/dashboard/Dashboard';

export const UserDashboard = () => {
  return (
	<>
	  <PageHeader 
		icon={<IconDashboard className="w-7 h-7" />}
		title="Dashboard"
	  />
	  < Dashboard />
	</>
  );
};