import { PageHeader, IconSettings } from '@shared';
import { Settings } from '@/features/users/settings/Settings';

export const UserSettings = () => {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-shrink-0">
        <PageHeader
          icon={<IconSettings className="w-7 h-7" />}
          title="Settings"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="min-h-full flex flex-col justify-center">
          <Settings />
        </div>
      </div>
    </div>
  );
};