import React, { useEffect, useState } from 'react';
import { UserChipItem } from '@shared/types/user.types';
import { authService } from '@features/auth/auth.service';
import { useSocket } from '@/features/socketio/SocketContext';

const getUserStatus = async () => {
  const userData = await authService.getMe();
  console.log('[UserChip] ', userData);
  return userData.userStatus || 'offline'
}

export function UserChip({
  name,
  role,
  photo,
  expandStatus,
}: UserChipItem & { expandStatus: string })
{
  const { enableSocket, isConnected, onlineStatus, setOnlineStatus } = useSocket();
  const statusColors = {
    online: 'bg-accent-lime',
    offline: 'bg-foreground-4',
    away: 'bg-warning',
    in_meeting: 'bg-danger',
    focus: 'bg-warning'
  };

  useEffect(() => { enableSocket(); }, []);
  useEffect(() => {
    const fetchStatus = async () => {
      const status = await getUserStatus();
      setOnlineStatus(status);
    };
    fetchStatus();
  }, [isConnected, onlineStatus])

  return (
    <div className={`flex items-center ${expandStatus === 'expanded' ? 'gap-3' : 'justify-center'}`}>
      <div className="avatar-wrap h-11 w-11">
        <img
          src={photo}
          alt={`${name}'s profile`}
          className="avatar-img rounded-full"
        />
        <span className={`status-indicator ${statusColors[onlineStatus] || 'bg-foreground-4'}`} />
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
