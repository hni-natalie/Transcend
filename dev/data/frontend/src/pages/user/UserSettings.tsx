import { PageHeader, IconSettings } from '@shared';
// import features

export const UserSettings = () => {
  return (
    <>
      <PageHeader 
        icon={<IconSettings className="w-7 h-7" />}
        title="Settings"
      />
      <div className="flex items-center justify-center h-full">
        <p className="text-content-2">User Settings coming soon...</p>
      </div>
    </>
  );
};