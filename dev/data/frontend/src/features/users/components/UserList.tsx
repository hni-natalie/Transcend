import React, { useEffect, useState } from 'react';
import { DefaultAvatar } from '@shared/ui/DefaultAvatar'; 
import type { UserTableRow } from '@shared/types/user.types';
import { UserStatusBadge } from './UserStatusBadge';

interface UserListProps {
  user: UserTableRow;
  onEdit?: (user: UserTableRow) => void;
}

export const UserList = ({ user, onEdit }: UserListProps) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [user.photo]);

  const avatarSrc = user.photo?.trim();
  const showDefaultAvatar = !avatarSrc || imageError;

  return (
    <tr className="hover:bg-white/[0.02] transition-colors group">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          {showDefaultAvatar ? (
            <DefaultAvatar
              name={user.username}
              email={user.email}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <img
              src={avatarSrc}
              alt={user.username}
              className="w-12 h-12 rounded-full object-cover"
              onError={() => setImageError(true)}
            />
          )}

          <div className="flex flex-col">
            <span className="text-white font-medium text-base">
              {user.username}
            </span>
            <span className="text-foreground-3 text-sm">
              {user.email}
            </span>
          </div>
        </div>
      </td>

      <td className="py-6.5 px-4 text-base text-foreground-3">{user.department}</td>
      <td className="py-6.5 px-4 text-base text-foreground-3">{user.role}</td>
      <td className="py-6.5 px-4 text-base text-foreground-3">{user.location}</td>
      <td className="py-6.5 px-4">
        <UserStatusBadge status={user.status} />
      </td>
      <td className="py-6.5 px-4 text-base text-foreground-2">{user.dateJoined}</td>
      <td className="py-6.5 px-4">
        <button
          onClick={() => onEdit?.(user)}
          className="text-foreground-3 hover:text-white text-base font-bold transition-colors cursor-pointer"
        >
          EDIT
        </button>
      </td>
    </tr>
  );
};
