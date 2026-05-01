import React from 'react';
import { UserChipItem } from '@shared/types/user.types';

export function UserChip({
  name,
  role,
  photo,
  expandStatus,
}: UserChipItem & { expandStatus: string }) {
  return (
    <div className={`flex items-center ${expandStatus === 'expanded' ? 'gap-3' : 'justify-center'}`}>
      <div className="avatar-wrap h-11 w-11">
        <img
          src={photo}
          alt={`${name}'s profile`}
          className="avatar-img rounded-full"
        />
        <span className="status-indicator bg-accent-lime" />
      </div>

      {expandStatus === 'expanded' && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="truncate text-xs text-foreground-3">{role}</p>
        </div>
      )}
    </div>
  );
}
