import React from 'react';
import { getStatusColors, getStatusDisplay, UserBackendStatus } from '@shared';

interface UserStatusBadgeProps {
  status: UserBackendStatus;
  showDot?: boolean;
}

export const UserStatusBadge = ({ 
  status, 
  showDot = true 
}: UserStatusBadgeProps) => {
  const colors = getStatusColors(status);
  const displayName = getStatusDisplay(status);

  return (
    <div className="flex items-center gap-2">
      {showDot && (
        <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
      )}
      <span className={`text-base font-medium ${colors.text}`}>
        {displayName}
      </span>
    </div>
  );
};
