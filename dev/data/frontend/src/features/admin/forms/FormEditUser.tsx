import React from 'react';
import { UserForm } from './components/userForm';
import type { UserTableRow } from '@shared/types/user.types';

interface FormEditUserProps {
  user: UserTableRow;
  onClose: () => void;
  onSuccess: () => void;
  onDelete?: () => Promise<void> | void;
}

export function FormEditUser({ user, onClose, onSuccess, onDelete }: FormEditUserProps) {
  return (
    <UserForm 
      mode="edit"
      user={user}
      onClose={onClose}
      onSuccess={onSuccess}
      onDelete={onDelete}
    />
  );
}