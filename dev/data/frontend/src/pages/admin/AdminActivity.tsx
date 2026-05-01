import { PageHeader, IconActivity } from '@shared';
// add features

export const ActivityLog = () => {
  return (
    <>
      <PageHeader 
        icon={<IconActivity className="w-7 h-7" />}
        title="Activity Log"
      />
      <div className="flex items-center justify-center h-full">
        <p className="text-content-2">Activity Log coming soon...</p>
      </div>
    </>
  );
};