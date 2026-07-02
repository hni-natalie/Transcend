import { PageHeader, IconDashboard } from '@shared';
import { Dashboard } from '@/features/admin/dashboard/Dashboard';

export const AdminDashboard = () => {
  return (
    <>
	  <PageHeader 
		icon={<IconDashboard className="w-7 h-7" />}
		title="Dashboard"
		action={
		<button
		  // onClick={() => getRefresh(true)}
		  className="btn-header">
		  Refresh
		</button>
		}
	  />
	  < Dashboard />
    </>
  );
};