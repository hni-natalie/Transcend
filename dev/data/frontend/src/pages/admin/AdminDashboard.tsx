import { PageHeader, IconDashboard } from '@shared';
// add features

export const AdminDashboard = () => {
  return (
    <>
      <PageHeader 
        icon={<IconDashboard className="w-7 h-7" />}
        title="Dashboard"
      />
      <div className="flex items-center justify-center h-full">
        <p className="text-content-2">Admin Dashboard coming soon...</p>
      </div>
    </>
  );
};