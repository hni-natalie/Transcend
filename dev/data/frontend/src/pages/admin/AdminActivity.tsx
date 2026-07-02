import { PageHeader, IconActivity } from '@shared';
import { ActivityLog } from '@/features/admin';

export const AdminActivity = () => {
  return (
    <>
      <PageHeader 
        icon={<IconActivity className="w-7 h-7" />}
        title="Activity Log"
      />
      < ActivityLog />
    </>
  );
};