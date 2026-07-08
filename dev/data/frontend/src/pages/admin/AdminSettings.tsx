import { PageHeader, IconSettings } from '@shared';
// add features

export const AdminSettings = () => {
  return (
    <>
      <PageHeader 
        icon={<IconSettings className="w-7 h-7" />}
        title="Settings"
      />
      <div className="flex items-center justify-center h-full">
        <p className="text-foreground-3">Admin Settings coming soon...</p>
      </div>
    </>
  );
};