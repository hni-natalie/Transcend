import { PageHeader, IconActivity } from '@shared';
import { ActivityLog } from '@/features/admin';
import { ExportActivitiesButton } from '@/features/admin/activity/components';

export const AdminActivity = () => {
  return (
    <>
      <PageHeader 
        icon={<IconActivity className="w-7 h-7" />}
        title="Activity"
		action={<ExportActivitiesButton className="btn-header" />}
      />
      < ActivityLog />
    </>
  );
};