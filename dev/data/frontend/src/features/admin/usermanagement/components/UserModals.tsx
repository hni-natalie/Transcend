import React from 'react';
import { Modal } from '@shared';
import { FormAddUser, FormEditUser } from '@features/admin/forms';
import type { UserTableRow } from '@shared/types/user.types';

export interface UserModalsProps {
  showAddForm: boolean;
  showEditForm: boolean;
  selectedUser: UserTableRow | null;
  onCloseAdd: () => void;
  onCloseEdit: () => void;
  onAddSuccess: () => void;
  onEditSuccess: () => void;
  onDeleteUser: (userId: string, username: string) => Promise<void>;
}

export const UserModals = ({
  showAddForm,
  showEditForm,
  selectedUser,
  onCloseAdd,
  onCloseEdit,
  onAddSuccess,
  onEditSuccess,
  onDeleteUser,
}: UserModalsProps) => {
  return (
    <>
      <Modal isOpen={showAddForm} onClose={onCloseAdd}>
        <FormAddUser 
          onClose={onCloseAdd}
          onSuccess={onAddSuccess}
        />
      </Modal>

      <Modal isOpen={showEditForm} onClose={onCloseEdit}>
        {selectedUser && (
          <FormEditUser 
            user={selectedUser}
            onClose={onCloseEdit}
            onSuccess={onEditSuccess}
            onDelete={() => onDeleteUser(selectedUser.userId, selectedUser.username)}
          />
        )}
      </Modal>
    </>
  );
};
