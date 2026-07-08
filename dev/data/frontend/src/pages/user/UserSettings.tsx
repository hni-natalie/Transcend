import { PageHeader, IconSettings } from '@shared';
import { Settings } from '@/features/users/settings/Settings';

export const UserSettings = () => {
  return (
    <>
      <PageHeader 
        icon={<IconSettings className="w-7 h-7" />}
        title="Settings"
      />
      < Settings />
    </>
  );
};