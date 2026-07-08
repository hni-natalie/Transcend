import { useState } from 'react';
import { PageHeader, IconUsers } from '@shared';
import { UserManagement } from '@features/admin';

export const AdminUserManagement = () => {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <>
      <PageHeader 
        icon={<IconUsers className="w-7 h-7" />}
        title="Users"
        action={
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-header"
          >
            + Add User
          </button>
        }
      />
      <UserManagement 
        showAddForm={showAddForm} 
        onCloseAddForm={() => setShowAddForm(false)} 
      />
    </>
  );
};
