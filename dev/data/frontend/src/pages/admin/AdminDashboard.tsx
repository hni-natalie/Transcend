import { PageHeader, IconDashboard } from '@shared';
import { Dashboard } from '@/features/admin/dashboard/Dashboard';

export const AdminDashboard = () => {
  return (
	<div className="flex flex-col h-full min-h-0">
	  <div className="flex-shrink-0">
		<PageHeader 
		  icon={<IconDashboard className="w-7 h-7" />}
		  title="Dashboard"
		/>
	  </div>

	  <div className="flex-1 min-h-0 overflow-y-auto">
		<div className="min-h-full flex flex-col justify-center">
		  <Dashboard />
		</div>
	  </div>
	</div>
  );
};

