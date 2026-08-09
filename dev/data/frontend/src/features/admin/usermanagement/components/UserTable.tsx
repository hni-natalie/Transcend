import React from 'react';
import { UserList } from '@features/users';
import type { UserTableRow } from '@shared/types/user.types';

export interface UserTableProps {
  users: UserTableRow[];
  onEdit: (user: UserTableRow) => void;
}

export const UserTable = ({
  users,
  onEdit,
}: UserTableProps) => {
  if (users.length === 0) {
    return null;
  }

  return (
    <table className="w-full text-left border-collapse min-w-[800px] table-fixed">
      <thead className="sticky top-0 z-10 bg-background-1 border-b border-background-3">
        <tr className="text-foreground-2 text-base uppercase tracking-widest">
          <th className="py-4 px-4 font-bold w-[20%]">User</th>
          <th className="py-4 px-4 font-bold w-[12%]">Department</th>
          <th className="py-4 px-4 font-bold w-[12%]">Role</th>
		  <th className="py-4 px-4 font-bold w-[16%]">Title</th>
          <th className="py-4 px-4 font-bold w-[12%]">Location</th>
          <th className="py-4 px-4 font-bold w-[10%]">Status</th>
          <th className="py-4 px-4 font-bold w-[12%]">Date Joined</th>
          <th className="py-4 px-4 font-bold w-[8%]">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-background-2">
        {users.map((user) => (
          <UserList key={user.email} user={user} onEdit={onEdit} />
        ))}
      </tbody>
    </table>
  );
};
