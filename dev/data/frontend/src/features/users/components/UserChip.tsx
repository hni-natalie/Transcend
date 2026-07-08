import { useEffect, useState } from 'react';
import { UserChipItem } from '@shared/types/user.types';
import { DefaultAvatar } from '@/shared';
import { getStatusColors, UserStatusType } from '@shared/lib/constants/userStatus';

export function UserChip({
  name,
  role,
  photo,
  email,
  expandStatus,
  status = 'offline', 
}: UserChipItem & { expandStatus: string }) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [photo]);

  const avatarSrc = photo?.trim();
  const showDefaultAvatar = !avatarSrc || imageError;

  const statusColors = getStatusColors(status as UserStatusType);

  return (
    <div className={`flex items-center ${expandStatus === 'expanded' ? 'gap-3' : 'justify-center'}`}>
      <div className="avatar-wrap h-11 w-11">
        {showDefaultAvatar ? (
          <DefaultAvatar
            name={name}
            email={email}
            className="avatar-img rounded-full"
          />
        ) : (
          <img
            src={avatarSrc}
            alt={`${name}'s profile`}
            className="avatar-img rounded-full w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
        <span className={`status-indicator ${statusColors.dot}`} />
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
