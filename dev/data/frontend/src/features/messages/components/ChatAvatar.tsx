import React, { useEffect, useState } from 'react';
import { DefaultAvatar, getStatusDotColor, IconGroup } from '@shared';
import type { UserBackendStatus } from '@shared';

interface ChatAvatarProps {
  size?: 'sm' | 'ml' | 'lg';
  status?: UserBackendStatus;
  name?: string;
  email?: string;
  photo?: string;
  isGroup?: boolean;
}

export function ChatAvatar({ size = 'sm', status, name = 'User', email, photo, isGroup = false }: ChatAvatarProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [photo]);

  const dimensions = {
    sm: 'h-14 w-14',
    ml: 'h-14 w-14',
    lg: 'h-28 w-28',
  };

  const indicatorSizes = {
    sm: 'h-4 w-4 border-2',
    ml: 'h-4 w-4 border-2',
    lg: 'h-8 w-8 border-[4px]',
  };

  const groupIconSizes = {
    sm: 'w-7 h-7',
    ml: 'w-7 h-7',
    lg: 'w-14 h-14',
  };

  const dimension = dimensions[size] || dimensions.sm;
  const indicatorSize = indicatorSizes[size] || indicatorSizes.sm;
  const groupIconSize = groupIconSizes[size] || groupIconSizes.sm;

  const avatarSrc = photo?.trim();
  const showPhoto = Boolean(avatarSrc) && !imageError;

  return (
    <div className={`avatar-wrap ${dimension}`}>
      {showPhoto ? (
        <img
          src={avatarSrc}
          alt={name}
          className="avatar-img rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : isGroup ? (
        <div className="avatar-img flex items-center justify-center bg-background-3">
          <IconGroup className={`${groupIconSize} text-accent-lime`} strokeWidth={1} />
        </div>
      ) : (
        <DefaultAvatar name={name} email={email} className="avatar-img rounded-full" />
      )}

      {!isGroup && status && <span className={`status-indicator ${indicatorSize} ${getStatusDotColor(status)}`} />}
    </div>
  );
}